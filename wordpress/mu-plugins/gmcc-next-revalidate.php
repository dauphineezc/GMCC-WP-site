<?php
/**
 * Plugin Name: GMCC Next.js On-Demand Revalidate
 * Description: Notifies the Next.js front end when WordPress content changes so ISR/Data Cache can purge immediately.
 * Version: 1.0.0
 * Author: Greater Midland
 *
 * Install: copy this file to wp-content/mu-plugins/gmcc-next-revalidate.php
 * (mu-plugins load automatically; create the folder if it does not exist).
 *
 * Required wp-config.php (or server env) constants:
 *   define('GMCC_NEXT_REVALIDATE_URL', 'https://YOUR-NEXT-HOST/api/revalidate');
 *   define('GMCC_NEXT_REVALIDATE_SECRET', 'same-value-as-Next-REVALIDATE_SECRET');
 *
 * Optional:
 *   define('GMCC_NEXT_REVALIDATE_DEBUG', true); // logs failures to PHP error_log
 */

if (!defined('ABSPATH')) {
	exit;
}

final class GMCC_Next_Revalidate {
	/** @var array<string, true> */
	private static $queued = array();

	public static function init(): void {
		add_action('save_post', array(__CLASS__, 'on_save_post'), 20, 3);
		add_action('before_delete_post', array(__CLASS__, 'on_delete_post'), 10, 1);
		add_action('wp_trash_post', array(__CLASS__, 'on_delete_post'), 10, 1);
		add_action('untrash_post', array(__CLASS__, 'on_untrash_post'), 10, 1);
		add_action('created_term', array(__CLASS__, 'on_term_change'), 10, 3);
		add_action('edited_term', array(__CLASS__, 'on_term_change'), 10, 3);
		add_action('delete_term', array(__CLASS__, 'on_term_delete'), 10, 3);
		add_action('wp_update_nav_menu', array(__CLASS__, 'on_nav_menu'), 10, 1);
		add_action('shutdown', array(__CLASS__, 'flush_queue'), 0);
	}

	private static function configured(): bool {
		return defined('GMCC_NEXT_REVALIDATE_URL')
			&& defined('GMCC_NEXT_REVALIDATE_SECRET')
			&& is_string(GMCC_NEXT_REVALIDATE_URL)
			&& is_string(GMCC_NEXT_REVALIDATE_SECRET)
			&& GMCC_NEXT_REVALIDATE_URL !== ''
			&& GMCC_NEXT_REVALIDATE_SECRET !== '';
	}

	private static function debug(string $message): void {
		if (defined('GMCC_NEXT_REVALIDATE_DEBUG') && GMCC_NEXT_REVALIDATE_DEBUG) {
			error_log('[GMCC Next Revalidate] ' . $message);
		}
	}

	/**
	 * @param array<string, mixed> $payload
	 */
	private static function enqueue(array $payload): void {
		if (!self::configured()) {
			self::debug('Skipped: GMCC_NEXT_REVALIDATE_URL / SECRET not defined.');
			return;
		}

		$key = md5(wp_json_encode($payload));
		self::$queued[ $key ] = $payload;
	}

	public static function flush_queue(): void {
		if (empty(self::$queued) || !self::configured()) {
			return;
		}

		$batch = self::$queued;
		self::$queued = array();

		foreach ($batch as $payload) {
			self::send($payload);
		}
	}

	/**
	 * @param array<string, mixed> $payload
	 */
	private static function send(array $payload): void {
		$payload['secret'] = GMCC_NEXT_REVALIDATE_SECRET;

		$response = wp_remote_post(
			GMCC_NEXT_REVALIDATE_URL,
			array(
				'timeout'  => 8,
				'blocking' => false, // don't slow down WP admin saves
				'headers'  => array(
					'Content-Type'        => 'application/json',
					'X-Revalidate-Secret' => GMCC_NEXT_REVALIDATE_SECRET,
				),
				'body'     => wp_json_encode($payload),
			)
		);

		if (is_wp_error($response)) {
			self::debug('Request error: ' . $response->get_error_message());
		}
	}

	public static function on_save_post(int $post_id, WP_Post $post, bool $update): void {
		if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
			return;
		}

		// Skip pure drafts that were never public (still notify on publish/update/private).
		if ($post->post_status === 'auto-draft') {
			return;
		}

		$payload = array(
			'post_type' => $post->post_type,
			'slug'      => $post->post_name,
			'action'    => $update ? 'update' : 'create',
		);

		if ($post->post_type === 'event') {
			$start = self::guess_event_start($post_id);
			if ($start) {
				$payload['event_start'] = $start;
			}
		}

		self::enqueue($payload);
	}

	public static function on_delete_post(int $post_id): void {
		$post = get_post($post_id);
		if (!$post instanceof WP_Post) {
			return;
		}
		if (wp_is_post_revision($post_id)) {
			return;
		}

		self::enqueue(
			array(
				'post_type' => $post->post_type,
				'slug'      => $post->post_name,
				'action'    => 'delete',
			)
		);
	}

	public static function on_untrash_post(int $post_id): void {
		$post = get_post($post_id);
		if (!$post instanceof WP_Post) {
			return;
		}
		self::enqueue(
			array(
				'post_type' => $post->post_type,
				'slug'      => $post->post_name,
				'action'    => 'untrash',
			)
		);
	}

	public static function on_term_change(int $term_id, int $tt_id, string $taxonomy): void {
		$term = get_term($term_id, $taxonomy);
		self::enqueue(
			array(
				'object_type' => 'term',
				'taxonomy'    => $taxonomy,
				'slug'        => ($term && !is_wp_error($term)) ? $term->slug : '',
				'action'      => 'term_change',
			)
		);
	}

	public static function on_term_delete(int $term_id, int $tt_id, string $taxonomy): void {
		self::enqueue(
			array(
				'object_type' => 'term',
				'taxonomy'    => $taxonomy,
				'action'      => 'term_delete',
			)
		);
	}

	public static function on_nav_menu(int $menu_id): void {
		self::enqueue(
			array(
				'object_type' => 'nav_menu',
				'action'      => 'menu_update',
			)
		);
	}

	/**
	 * Best-effort event start for building /events/YYYY/MM/slug paths.
	 * Adjust meta keys if your ACF field name differs.
	 */
	private static function guess_event_start(int $post_id): string {
		$candidates = array(
			'event_schedule_start_date',
			'start_date',
			'event_start',
			'eventStart',
		);

		foreach ($candidates as $key) {
			$value = get_post_meta($post_id, $key, true);
			if (is_string($value) && $value !== '') {
				return $value;
			}
		}

		// ACF repeater / group common pattern — first occurrence date if present.
		$schedule = get_post_meta($post_id, 'event_schedule', true);
		if (is_array($schedule)) {
			foreach ($schedule as $row) {
				if (!is_array($row)) {
					continue;
				}
				foreach (array('start_date', 'startDate', 'date') as $k) {
					if (!empty($row[ $k ]) && is_string($row[ $k ])) {
						return $row[ $k ];
					}
				}
			}
		}

		return '';
	}
}

GMCC_Next_Revalidate::init();
