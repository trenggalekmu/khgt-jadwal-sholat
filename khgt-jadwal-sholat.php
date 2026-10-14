<?php
/**
 * Plugin Name: Jadwal Sholat KHGT Muhammadiyah
 * Plugin URI:  https://github.com/trenggalekmu/khgt-jadwal-sholat
 * Description: Widget dan shortcode jadwal sholat harian beserta tanggal Hijriah (KHGT), dengan pencarian kota dan deteksi lokasi GPS.
 * Version:     1.0.0
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * Author:      mastrigus (MPID PDM Trenggalek)
 * Author URI:  https://trenggalekmu.com
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: khgt-jadwal-sholat
 */

if (!defined('ABSPATH')) {
    exit;
}

define('KHGT_PLUGIN_DIR', plugin_dir_url(__FILE__));

class KHGT_Prayer_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'khgt_prayer_widget',
            __('Jadwal Sholat KHGT', 'khgt-jadwal-sholat'),
            ['description' => __('Menampilkan widget jadwal sholat KHGT Muhammadiyah.', 'khgt-jadwal-sholat')]
        );
    }

    public function widget($args, $instance) {
        $default_city = !empty($instance['default_city']) ? $instance['default_city'] : 'Yogyakarta';
        echo $args['before_widget'];
        echo khgt_render_widget_html($default_city);
        echo $args['after_widget'];
    }

    public function form($instance) {
        $default_city = !empty($instance['default_city']) ? $instance['default_city'] : 'Yogyakarta';
        ?>
        <p>
            <label for="<?php echo esc_attr($this->get_field_id('default_city')); ?>"><?php _e('Kota Default:'); ?></label>
            <input class="widefat" id="<?php echo esc_attr($this->get_field_id('default_city')); ?>" name="<?php echo esc_attr($this->get_field_name('default_city')); ?>" type="text" value="<?php echo esc_attr($default_city); ?>">
        </p>
        <?php
    }

    public function update($new_instance, $old_instance) {
        $instance = [];
        $instance['default_city'] = (!empty($new_instance['default_city'])) ? sanitize_text_field($new_instance['default_city']) : 'Yogyakarta';
        return $instance;
    }
}

// Register assets
function khgt_enqueue_scripts() {
    wp_register_style('khgt-style', KHGT_PLUGIN_DIR . 'assets/css/khgt-widget.css', [], '1.0.0');
    wp_register_script('khgt-script', KHGT_PLUGIN_DIR . 'assets/js/khgt-widget.js', [], '1.0.0.' . filemtime(__DIR__ . '/assets/js/khgt-widget.js'), true);

    wp_localize_script('khgt-script', 'khgtConfig', [
        'apiBase' => 'https://khgt-api-dev.matadigital.workers.dev/api/sholat',
    ]);
}
add_action('wp_enqueue_scripts', 'khgt_enqueue_scripts');

// Render function
function khgt_render_widget_html($default_city = 'Yogyakarta') {
    wp_enqueue_style('khgt-style');
    wp_enqueue_script('khgt-script');

    $widget_id = 'khgt-' . wp_generate_uuid4();

    ob_start();
    ?>
    <div class="nm-ws-wrap khgt-widget-container" id="<?php echo esc_attr($widget_id); ?>" data-default-city="<?php echo esc_attr($default_city); ?>">
        <div class="nm-ws-head">
            <div class="nm-ws-search-wrap">
                <button type="button" class="nm-ws-btn btn-gps" title="Deteksi Lokasi Saya" aria-label="Deteksi Lokasi Saya">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                </button>
                <input type="text" class="nm-ws-input khgt-city-in" placeholder="Cari kota..." value="<?php echo esc_attr($default_city); ?>">
                <button type="button" class="nm-ws-btn btn-search khgt-city-go" title="Cari" aria-label="Cari Kota">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                </button>
            </div>
            <div class="nm-ws-loc"><span class="khgt-ui-city"><?php echo esc_html($default_city); ?></span></div>
            <div class="khgt-ui-date nm-ws-date">-</div>
        </div>
        <div class="nm-ws-khgt-wrap"><span class="khgt-ui-hijri nm-ws-badge">-</span></div>

        <div class="nm-ws-error khgt-error-box" style="display: none;"></div>
        <div class="nm-ws-loader khgt-loader" style="display: none;">Mengambil Data...</div>
        <ul class="nm-ws-list khgt-ui-list"></ul>

        <div class="nm-ws-footer">Sumber: <a href="https://khgt.muhammadiyah.or.id" target="_blank" rel="noopener noreferrer">khgt.muhammadiyah.or.id</a></div>
    </div>
    <?php
    return ob_get_clean();
}

// Shortcode: [jadwal_sholat_khgt kota="Yogyakarta"]
function khgt_shortcode($atts) {
    $a = shortcode_atts(['kota' => 'Yogyakarta'], $atts);
    return khgt_render_widget_html(sanitize_text_field($a['kota']));
}
add_shortcode('jadwal_sholat_khgt', 'khgt_shortcode');

// Register Widget
function khgt_register_widget() {
    register_widget('KHGT_Prayer_Widget');
}
add_action('widgets_init', 'khgt_register_widget');
