<?php
/**
 * Plugin Name: GMCC Next.js On-Demand Revalidate
 * Description: Notifies the Next.js front end when content changes.
 * Version: 1.1.1
 * Requires PHP: 7.4
 * Author: Greater Midland
 *
 * Configure per environment in wp-config.php:
 * define('GMCC_NEXT_REVALIDATE_URL', 'https://YOUR-NEXT-HOST/api/revalidate');
 * define('GMCC_NEXT_REVALIDATE_SECRET', 'same-value-as-Next-REVALIDATE_SECRET');
 * Optional:
 * define('GMCC_NEXT_REVALIDATE_TIMEOUT', 30); // seconds to wait for Next per request (30 is the default)
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
    // An event save makes Next re-render ~15 pages (listings, detail, every center), which can take 15s+.
    const DEFAULT_TIMEOUT = 30;
    const ACCESS_COOKIE_TRANSIENT = 'gmcc_next_revalidate_access_cookie';
    // The platform's access cookie lasts 24 hours; refresh a little early.
    const ACCESS_COOKIE_TTL = 20 * HOUR_IN_SECONDS;

    // Menus are covered once by wp_update_nav_menu; each item save would otherwise trigger a full layout refresh.
    const IGNORED_POST_TYPES = array('nav_menu_item', 'attachment', 'revision', 'customize_changeset', 'oembed_cache', 'user_request');
    const IGNORED_TAXONOMIES = array('nav_menu', 'post_format');

    private static $queued = array();
    private static $was_published = array();
    /** Event slug and schedule as they were before an update, so their old URLs refresh too. */
    private static $previous_event = array();

    public static function init(): void {
        // Fires before WordPress and ACF write the new values, so meta read here is still the old state.
        add_action('pre_post_update', array(__CLASS__, 'on_pre_post_update'), 10, 2);
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
        // The editor is no longer waiting, so allow the Next requests to finish past the usual PHP limit.
        if (function_exists('set_time_limit')) {
            @set_time_limit(120);
        }
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
        self::attach_event_fields($payload, $post_id, $post->post_type, $post->post_name);
        self::enqueue($payload);
    }

    public static function on_delete_post(int $post_id): void {
        $post = get_post($post_id);
        // Trashing already refreshed the site; permanently deleting a trashed or draft post changes nothing.
        if (!$post instanceof WP_Post || wp_is_post_revision($post_id) || $post->post_status !== 'publish' || !self::is_tracked_post_type($post->post_type)) {
            return;
        }
        $payload = array('post_type' => $post->post_type, 'slug' => $post->post_name, 'action' => 'delete');
        self::attach_event_fields($payload, $post_id, $post->post_type, $post->post_name);
        self::enqueue($payload);
    }

    public static function on_untrash_post(int $post_id): void {
        $post = get_post($post_id);
        if (!$post instanceof WP_Post || !self::is_tracked_post_type($post->post_type)) {
            return;
        }
        $payload = array('post_type' => $post->post_type, 'slug' => $post->post_name, 'action' => 'untrash');
        self::attach_event_fields($payload, $post_id, $post->post_type, $post->post_name);
        self::enqueue($payload);
    }

    public static function on_pre_post_update(int $post_id, $data): void {
        if (!self::configured() || get_post_type($post_id) !== 'event') {
            return;
        }
        $old = get_post($post_id);
        self::$previous_event[$post_id] = array(
            'slug' => $old instanceof WP_Post ? (string) $old->post_name : '',
            'occurrences' => self::collect_event_occurrences($post_id),
        );
    }

    /**
     * Event detail pages live at /events/{yyyy}/{mm}/{slug}, so send that path (one per occurrence date).
     * The previous slug and dates are included too, so a renamed or rescheduled event doesn't leave its
     * old URL stale. Center pages are handled by the Next endpoint, which refreshes every /centers/{slug}
     * on any event change (an edit may also move an event between centers).
     */
    private static function attach_event_fields(array &$payload, int $post_id, string $post_type, string $slug): void {
        if ($post_type !== 'event') {
            return;
        }
        $previous = isset(self::$previous_event[$post_id])
            ? self::$previous_event[$post_id]
            : array('slug' => '', 'occurrences' => array());

        $occurrences = self::collect_event_occurrences($post_id);
        if (empty($occurrences)) {
            self::debug('No event schedule found for event #' . $post_id . ' (' . $slug . '); detail page path not sent.');
        } else {
            $active = self::pick_active_event_start($occurrences);
            if ($active !== '') {
                $payload['event_start'] = $active;
            }
        }

        $paths = array_values(array_unique(array_merge(
            self::event_detail_paths($slug, $occurrences),
            self::event_detail_paths($previous['slug'], $previous['occurrences'])
        )));
        if (!empty($paths)) {
            $payload['paths'] = $paths;
        }
    }

    /**
     * Raw (unformatted) ACF value: get_field() would apply the field's display format
     * (e.g. "10/30/2026 5:00 pm"), but we need the stored value. Also looks inside a group field.
     *
     * @param list<string> $names
     * @return mixed|null
     */
    private static function acf_value(int $post_id, array $names) {
        if (!function_exists('get_field')) {
            return null;
        }
        foreach ($names as $name) {
            $value = get_field($name, $post_id, false);
            if ($value !== null && $value !== '' && $value !== false && $value !== array()) {
                return $value;
            }
        }
        foreach (array('event_fields', 'eventFields') as $group) {
            $values = get_field($group, $post_id, false);
            if (!is_array($values)) {
                continue;
            }
            foreach ($names as $name) {
                if (isset($values[$name]) && $values[$name] !== '' && $values[$name] !== array()) {
                    return $values[$name];
                }
            }
        }
        return null;
    }

    /** Normalize a stored/formatted date to start with YYYY-MM-DD, or '' if it can't be understood. */
    private static function normalize_datetime(string $raw): string {
        $raw = trim($raw);
        if ($raw === '') {
            return '';
        }
        if (preg_match('/^\d{4}-\d{2}-\d{2}/', $raw)) {
            return $raw;
        }
        if (preg_match('/^(\d{4})(\d{2})(\d{2})(?:\D|$)/', $raw, $m)) {
            return $m[1] . '-' . $m[2] . '-' . $m[3];
        }
        $ts = strtotime($raw);
        return $ts === false ? '' : gmdate('Y-m-d H:i:s', $ts);
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

    /**
     * Read ACF eventSchedule repeater rows.
     * GraphQL shape: eventSchedule { datetime { startDatetime endDatetime } }
     * PHP/ACF typically uses snake_case field names.
     *
     * @return array<int, array{start: string, end: string}>
     */
    private static function collect_event_occurrences(int $post_id): array {
        $rows = array();

        $value = self::acf_value($post_id, array('event_schedule', 'eventSchedule'));
        if (is_array($value)) {
            $rows = $value;
        }

        if ($rows === array()) {
            $meta = get_post_meta($post_id, 'event_schedule', true);
            if (is_array($meta)) {
                $rows = $meta;
            } elseif (is_numeric($meta) && (int) $meta > 0) {
                // ACF stores repeater length in event_schedule and values in indexed meta keys.
                for ($i = 0; $i < (int) $meta; $i++) {
                    $start = get_post_meta($post_id, "event_schedule_{$i}_datetime_start_datetime", true);
                    $end = get_post_meta($post_id, "event_schedule_{$i}_datetime_end_datetime", true);
                    if (!is_string($start) || $start === '') {
                        $start = get_post_meta($post_id, "event_schedule_{$i}_start_datetime", true);
                    }
                    if (!is_string($end) || $end === '') {
                        $end = get_post_meta($post_id, "event_schedule_{$i}_end_datetime", true);
                    }
                    $rows[] = array(
                        'datetime' => array(
                            'start_datetime' => is_string($start) ? $start : '',
                            'end_datetime' => is_string($end) ? $end : '',
                        ),
                    );
                }
            }
        }

        $occurrences = array();
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $pair = self::occurrence_from_row($row);
            if ($pair['start'] === '' && $pair['end'] === '') {
                continue;
            }
            $occurrences[] = $pair;
        }

        if (empty($occurrences)) {
            // Legacy single-field fallbacks.
            foreach (array('event_schedule_start_date', 'start_date', 'event_start', 'eventStart') as $key) {
                $value = get_post_meta($post_id, $key, true);
                $start = is_string($value) ? self::normalize_datetime($value) : '';
                if ($start !== '') {
                    $occurrences[] = array('start' => $start, 'end' => '');
                    break;
                }
            }
        }

        usort(
            $occurrences,
            static function (array $a, array $b): int {
                return self::occurrence_start_ts($a) <=> self::occurrence_start_ts($b);
            }
        );

        return $occurrences;
    }

    /** @return array{start: string, end: string} */
    private static function occurrence_from_row(array $row): array {
        $dt = (isset($row['datetime']) && is_array($row['datetime'])) ? $row['datetime'] : $row;
        $start = '';
        $end = '';
        foreach (array('start_datetime', 'startDatetime', 'start_date', 'startDate', 'date') as $key) {
            if (!empty($dt[$key]) && is_string($dt[$key])) {
                $start = $dt[$key];
                break;
            }
        }
        foreach (array('end_datetime', 'endDatetime', 'end_date', 'endDate') as $key) {
            if (!empty($dt[$key]) && is_string($dt[$key])) {
                $end = $dt[$key];
                break;
            }
        }
        return array('start' => self::normalize_datetime($start), 'end' => self::normalize_datetime($end));
    }

    /** @param array{start: string, end: string} $occurrence */
    private static function occurrence_start_ts(array $occurrence): int {
        $raw = $occurrence['start'] !== '' ? $occurrence['start'] : $occurrence['end'];
        if ($raw === '') {
            return 0;
        }
        $ts = strtotime($raw);
        return $ts === false ? 0 : $ts;
    }

    /** @param array{start: string, end: string} $occurrence */
    private static function occurrence_end_ts(array $occurrence): int {
        $raw = $occurrence['end'] !== '' ? $occurrence['end'] : $occurrence['start'];
        if ($raw === '') {
            return 0;
        }
        $ts = strtotime($raw);
        return $ts === false ? 0 : $ts;
    }

    /**
     * Match Next getEventDateInfo: next occurrence that has not ended, else the last one.
     *
     * @param array<int, array{start: string, end: string}> $occurrences
     */
    private static function pick_active_event_start(array $occurrences): string {
        if (empty($occurrences)) {
            return '';
        }
        $now = time();
        foreach ($occurrences as $occurrence) {
            if (self::occurrence_end_ts($occurrence) >= $now) {
                return $occurrence['start'] !== '' ? $occurrence['start'] : $occurrence['end'];
            }
        }
        $last = $occurrences[count($occurrences) - 1];
        return $last['start'] !== '' ? $last['start'] : $last['end'];
    }

    /**
     * Detail URL for each occurrence date (the site builds /events/{yyyy}/{mm}/{slug} from the start date).
     * Dates are already normalized to YYYY-MM-DD... by collect_event_occurrences().
     *
     * @param array<int, array{start: string, end: string}> $occurrences
     * @return list<string>
     */
    private static function event_detail_paths(string $slug, array $occurrences): array {
        if ($slug === '') {
            return array();
        }
        $paths = array();
        foreach ($occurrences as $occurrence) {
            $raw = $occurrence['start'] !== '' ? $occurrence['start'] : $occurrence['end'];
            if (preg_match('/^(\d{4})-(\d{2})/', $raw, $m)) {
                $paths[] = '/events/' . $m[1] . '/' . $m[2] . '/' . $slug;
            }
        }
        return array_values(array_unique($paths));
    }
}

GMCC_Next_Revalidate::init();
