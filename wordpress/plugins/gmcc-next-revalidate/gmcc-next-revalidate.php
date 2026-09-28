<?php
/**
 * Plugin Name: GMCC Next.js On-Demand Revalidate
 * Description: Notifies the Next.js front end when content changes.
 * Version: 1.1.0
 * Requires PHP: 7.4
 * Author: Greater Midland
 *
 * Configure per environment in wp-config.php:
 * define('GMCC_NEXT_REVALIDATE_URL', 'https://YOUR-NEXT-HOST/api/revalidate');
 * define('GMCC_NEXT_REVALIDATE_SECRET', 'same-value-as-Next-REVALIDATE_SECRET');
 * Optional:
 * define('GMCC_NEXT_REVALIDATE_TIMEOUT', 15); // seconds to wait for Next per request
 * define('GMCC_NEXT_REVALIDATE_DEBUG', true); // also log successes and skips
 * define('GMCC_NEXT_REVALIDATE_SITE_PASSWORD', '…'); // front end behind Headless Platform password protection
 *
 * Failures are always written to the PHP error log (WP Engine: User Portal → Logs).
 */

if (!defined('ABSPATH')) {
    exit;
}

// Guard with a constant, not class_exists(): PHP declares the class below at compile time,
// so class_exists() is already true here on the first load. Returning before the class
// statement also prevents a redeclaration fatal if a must-use copy is loaded too.
if (defined('GMCC_NEXT_REVALIDATE_LOADED')) {
    return;
}
define('GMCC_NEXT_REVALIDATE_LOADED', true);

final class GMCC_Next_Revalidate {
    const DEFAULT_TIMEOUT = 15;
    const ACCESS_COOKIE_TRANSIENT = 'gmcc_next_revalidate_access_cookie';
    // The platform's access cookie lasts 24 hours; refresh a little early.
    const ACCESS_COOKIE_TTL = 20 * HOUR_IN_SECONDS;

    // Menus are covered once by wp_update_nav_menu; each item save would otherwise trigger a full layout refresh.
    const IGNORED_POST_TYPES = array('nav_menu_item', 'attachment', 'revision', 'customize_changeset', 'oembed_cache', 'user_request');
    const IGNORED_TAXONOMIES = array('nav_menu', 'post_format');

    private static $queued = array();
    private static $was_published = array();

    public static function init(): void {
        add_action('transition_post_status', array(__CLASS__, 'on_transition_status'), 10, 3);
        add_action('save_post', array(__CLASS__, 'on_save_post'), 20, 3);
        add_action('before_delete_post', array(__CLASS__, 'on_delete_post'), 10, 1);
        add_action('wp_trash_post', array(__CLASS__, 'on_delete_post'), 10, 1);
        add_action('untrash_post', array(__CLASS__, 'on_untrash_post'), 10, 1);
        add_action('created_term', array(__CLASS__, 'on_term_change'), 10, 3);
        add_action('edited_term', array(__CLASS__, 'on_term_change'), 10, 3);
        add_action('delete_term', array(__CLASS__, 'on_term_delete'), 10, 3);
        add_action('wp_update_nav_menu', array(__CLASS__, 'on_nav_menu'), 10, 1);
        // After WordPress flushes output buffers (priority 1) so the response can be released first.
        add_action('shutdown', array(__CLASS__, 'flush_queue'), 100);
        add_action('admin_notices', array(__CLASS__, 'config_notice'));
    }

    public static function config_notice(): void {
        if (self::configured() || !current_user_can('activate_plugins')) {
            return;
        }
        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        if (!$screen || $screen->id !== 'plugins') {
            return;
        }
        echo '<div class="notice notice-warning"><p><strong>GMCC Next.js On-Demand Revalidate</strong> is not sending updates: define <code>GMCC_NEXT_REVALIDATE_URL</code> and <code>GMCC_NEXT_REVALIDATE_SECRET</code> in <code>wp-config.php</code>.</p></div>';
    }

    private static function configured(): bool {
        return defined('GMCC_NEXT_REVALIDATE_URL')
            && defined('GMCC_NEXT_REVALIDATE_SECRET')
            && is_string(GMCC_NEXT_REVALIDATE_URL)
            && is_string(GMCC_NEXT_REVALIDATE_SECRET)
            && GMCC_NEXT_REVALIDATE_URL !== ''
            && GMCC_NEXT_REVALIDATE_SECRET !== '';
    }

    private static function timeout(): int {
        if (defined('GMCC_NEXT_REVALIDATE_TIMEOUT') && (int) GMCC_NEXT_REVALIDATE_TIMEOUT > 0) {
            return (int) GMCC_NEXT_REVALIDATE_TIMEOUT;
        }
        return self::DEFAULT_TIMEOUT;
    }

    private static function log_error(string $message): void {
        error_log('[GMCC Next Revalidate] ' . $message);
    }

    private static function debug(string $message): void {
        if (defined('GMCC_NEXT_REVALIDATE_DEBUG') && GMCC_NEXT_REVALIDATE_DEBUG) {
            error_log('[GMCC Next Revalidate] ' . $message);
        }
    }

    private static function describe(array $payload): string {
        $type = isset($payload['post_type']) ? $payload['post_type'] : (isset($payload['object_type']) ? $payload['object_type'] : 'unknown');
        $slug = isset($payload['slug']) && $payload['slug'] !== '' ? '/' . $payload['slug'] : '';
        return $type . $slug;
    }

    private static function enqueue(array $payload): void {
        if (!self::configured()) {
            self::debug('Skipped: GMCC_NEXT_REVALIDATE_URL / SECRET not defined.');
            return;
        }
        // Keyed without 'action': trashing fires both the trash hook and save_post for the same target.
        $target = $payload;
        unset($target['action']);
        $key = md5(wp_json_encode($target));
        self::$queued[$key] = $payload;
    }

    public static function flush_queue(): void {
        if (empty(self::$queued) || !self::configured()) {
            return;
        }
        $batch = self::$queued;
        self::$queued = array();

        // Release the editor's HTTP response before waiting on Next (PHP-FPM / LiteSpeed).
        ignore_user_abort(true);
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        } elseif (function_exists('litespeed_finish_request')) {
            litespeed_finish_request();
        }

        foreach ($batch as $payload) {
            self::send($payload);
        }
    }

    private static function site_password(): string {
        return defined('GMCC_NEXT_REVALIDATE_SITE_PASSWORD') && is_string(GMCC_NEXT_REVALIDATE_SITE_PASSWORD)
            ? GMCC_NEXT_REVALIDATE_SITE_PASSWORD
            : '';
    }

    /**
     * Cookie header that gets past the Headless Platform password gate, or '' when not configured.
     * The gate has no documented API: it accepts a form POST of `password` on any path and sets a cookie.
     */
    private static function access_cookie(bool $refresh = false): string {
        $password = self::site_password();
        if ($password === '') {
            return '';
        }
        if (!$refresh) {
            $cached = get_transient(self::ACCESS_COOKIE_TRANSIENT);
            if (is_string($cached) && $cached !== '') {
                return $cached;
            }
        }

        $parts = wp_parse_url(GMCC_NEXT_REVALIDATE_URL);
        if (empty($parts['scheme']) || empty($parts['host'])) {
            return '';
        }
        $origin = $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '') . '/';

        $response = wp_remote_post($origin, array(
            'timeout' => self::timeout(),
            'redirection' => 0,
            'body' => array('password' => $password),
        ));
        if (is_wp_error($response)) {
            self::log_error('Site password login failed: ' . $response->get_error_message());
            return '';
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status === 401 || $status === 403) {
            self::log_error('Site password rejected (HTTP ' . $status . '). Check GMCC_NEXT_REVALIDATE_SITE_PASSWORD.');
            return '';
        }

        $pairs = array();
        foreach (wp_remote_retrieve_cookies($response) as $cookie) {
            if ($cookie instanceof WP_Http_Cookie && $cookie->name !== '') {
                $pairs[] = $cookie->name . '=' . $cookie->value;
            }
        }
        if (empty($pairs)) {
            self::log_error('Site password login returned no cookie (HTTP ' . $status . ').');
            return '';
        }

        $header = implode('; ', $pairs);
        set_transient(self::ACCESS_COOKIE_TRANSIENT, $header, self::ACCESS_COOKIE_TTL);
        self::debug('Obtained front-end access cookie.');
        return $header;
    }

    private static function post_payload(array $payload, string $cookie) {
        $headers = array(
            'Content-Type' => 'application/json',
            'X-Revalidate-Secret' => GMCC_NEXT_REVALIDATE_SECRET,
        );
        if ($cookie !== '') {
            $headers['Cookie'] = $cookie;
        }
        return wp_remote_post(
            GMCC_NEXT_REVALIDATE_URL,
            array(
                'timeout' => self::timeout(),
                'blocking' => true,
                'headers' => $headers,
                'body' => wp_json_encode($payload),
            )
        );
    }

    private static function send(array $payload): void {
        $label = self::describe($payload);
        $response = self::post_payload($payload, self::access_cookie());

        if (is_wp_error($response)) {
            // A timeout here does not necessarily mean Next failed; it may still finish the refresh.
            self::log_error('Request error for ' . $label . ': ' . $response->get_error_message());
            return;
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        $raw = (string) wp_remote_retrieve_body($response);
        $json = json_decode($raw, true);

        // Next's own 401 is JSON ("Invalid token"); an HTML 401 is the password gate, so the cookie expired.
        if ($status === 401 && !is_array($json) && self::site_password() !== '') {
            $cookie = self::access_cookie(true);
            if ($cookie !== '') {
                $response = self::post_payload($payload, $cookie);
                if (is_wp_error($response)) {
                    self::log_error('Request error for ' . $label . ': ' . $response->get_error_message());
                    return;
                }
                $status = (int) wp_remote_retrieve_response_code($response);
                $raw = (string) wp_remote_retrieve_body($response);
                $json = json_decode($raw, true);
            }
        }

        if ($status < 200 || $status >= 300) {
            $detail = is_array($json) && isset($json['error']) && is_string($json['error']) ? $json['error'] : substr($raw, 0, 300);
            self::log_error('HTTP ' . $status . ' for ' . $label . ($detail !== '' ? ': ' . $detail : ''));
            return;
        }

        if (!is_array($json)) {
            self::log_error('Unexpected non-JSON response (HTTP ' . $status . ') for ' . $label . '.');
            return;
        }

        if (!empty($json['revalidateErrors']) && is_array($json['revalidateErrors'])) {
            self::log_error('Partial failure for ' . $label . ': ' . implode('; ', array_map('strval', $json['revalidateErrors'])));
        }

        $edge = isset($json['edge']['status']) ? (string) $json['edge']['status'] : 'unknown';
        if ($edge === 'error') {
            $edge_error = isset($json['edge']['error']) ? (string) $json['edge']['error'] : 'unknown error';
            self::log_error('Edge purge failed for ' . $label . ': ' . $edge_error);
        }

        $paths = isset($json['revalidated']['paths']) && is_array($json['revalidated']['paths']) ? count($json['revalidated']['paths']) : 0;
        self::debug('Done ' . $label . ': ' . $paths . ' path(s) revalidated, edge ' . $edge . '.');
    }

    private static function is_tracked_post_type(string $post_type): bool {
        if (in_array($post_type, self::IGNORED_POST_TYPES, true)) {
            return false;
        }
        $object = get_post_type_object($post_type);
        // The front end only reads what WPGraphQL exposes.
        $tracked = $object && (!empty($object->show_in_graphql) || !empty($object->public));
        return (bool) apply_filters('gmcc_next_revalidate_track_post_type', $tracked, $post_type);
    }

    private static function is_tracked_taxonomy(string $taxonomy): bool {
        if (in_array($taxonomy, self::IGNORED_TAXONOMIES, true)) {
            return false;
        }
        $object = get_taxonomy($taxonomy);
        $tracked = $object && (!empty($object->show_in_graphql) || !empty($object->public));
        return (bool) apply_filters('gmcc_next_revalidate_track_taxonomy', $tracked, $taxonomy);
    }

    public static function on_transition_status(string $new_status, string $old_status, WP_Post $post): void {
        if ($old_status === 'publish') {
            self::$was_published[$post->ID] = true;
        }
    }

    public static function on_save_post(int $post_id, WP_Post $post, bool $update): void {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id) || !self::is_tracked_post_type($post->post_type)) {
            return;
        }
        // Drafts and pending posts aren't on the site; only publishing or unpublishing changes it.
        if ($post->post_status !== 'publish' && empty(self::$was_published[$post_id])) {
            return;
        }
        $payload = array(
            'post_type' => $post->post_type,
            'slug' => $post->post_name,
            'action' => $post->post_status === 'publish' ? ($update ? 'update' : 'create') : 'unpublish',
        );
        if ($post->post_type === 'event') {
            $start = self::guess_event_start($post_id);
            if ($start !== '') {
                $payload['event_start'] = $start;
            }
        }
        self::enqueue($payload);
    }

    public static function on_delete_post(int $post_id): void {
        $post = get_post($post_id);
        // Trashing already refreshed the site; permanently deleting a trashed or draft post changes nothing.
        if (!$post instanceof WP_Post || wp_is_post_revision($post_id) || $post->post_status !== 'publish' || !self::is_tracked_post_type($post->post_type)) {
            return;
        }
        self::enqueue(array('post_type' => $post->post_type, 'slug' => $post->post_name, 'action' => 'delete'));
    }

    public static function on_untrash_post(int $post_id): void {
        $post = get_post($post_id);
        if (!$post instanceof WP_Post || !self::is_tracked_post_type($post->post_type)) {
            return;
        }
        self::enqueue(array('post_type' => $post->post_type, 'slug' => $post->post_name, 'action' => 'untrash'));
    }

    public static function on_term_change(int $term_id, int $tt_id, string $taxonomy): void {
        if (!self::is_tracked_taxonomy($taxonomy)) {
            return;
        }
        $term = get_term($term_id, $taxonomy);
        self::enqueue(array(
            'object_type' => 'term',
            'taxonomy' => $taxonomy,
            'slug' => ($term && !is_wp_error($term)) ? $term->slug : '',
            'action' => 'term_change',
        ));
    }

    public static function on_term_delete(int $term_id, int $tt_id, string $taxonomy): void {
        if (!self::is_tracked_taxonomy($taxonomy)) {
            return;
        }
        self::enqueue(array('object_type' => 'term', 'taxonomy' => $taxonomy, 'action' => 'term_delete'));
    }

    public static function on_nav_menu(int $menu_id): void {
        self::enqueue(array('object_type' => 'nav_menu', 'action' => 'menu_update'));
    }

    private static function guess_event_start(int $post_id): string {
        foreach (array('event_schedule_start_date', 'start_date', 'event_start', 'eventStart') as $key) {
            $value = get_post_meta($post_id, $key, true);
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }
        $schedule = get_post_meta($post_id, 'event_schedule', true);
        if (is_array($schedule)) {
            foreach ($schedule as $row) {
                if (!is_array($row)) {
                    continue;
                }
                foreach (array('start_date', 'startDate', 'date') as $key) {
                    if (!empty($row[$key]) && is_string($row[$key])) {
                        return $row[$key];
                    }
                }
            }
        }
        return '';
    }
}

GMCC_Next_Revalidate::init();
