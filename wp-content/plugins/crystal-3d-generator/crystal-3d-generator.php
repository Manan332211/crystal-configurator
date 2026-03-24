<?php
/*
Plugin Name: 3D Crystal Image Generator
Description: Three.js Crystal Viewer with AI Background Removal
Version: 1.0
Author: Manan Makwana
*/

if (!defined('ABSPATH')) exit;

// Enqueue Three.js and our custom scripts
add_action('wp_enqueue_scripts', function() {
    wp_enqueue_script('three-js', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.147.0/three.min.js', array(), null, true);
    // Add OrbitControls for rotation
    wp_enqueue_script('three-orbit', 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/controls/OrbitControls.js', array('three-js'), null, true);
    wp_enqueue_script('three-room-env', 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/environments/RoomEnvironment.js', array('three-js'), null, true);
    
    wp_enqueue_style('crystal-style', plugin_dir_url(__FILE__) . 'assets/css/style.css');
    wp_enqueue_script('crystal-main', plugin_dir_url(__FILE__) . 'assets/js/main.js', array('three-js', 'three-orbit', 'three-room-env'), '1.0', true);

    // Pass PHP data to JS (like API endpoints)
    wp_localize_script('crystal-main', 'crystalApp', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('crystal_nonce')
    ));
});

// Shortcode to display the tool: [crystal_viewer]
add_shortcode('crystal_viewer', function() {
    ob_start();
    include plugin_dir_path(__FILE__) . 'templates/viewer.php';
    return ob_get_clean();
});

// AJAX Handler for Background Removal (Using remove.bg API as example)
add_action('wp_ajax_remove_background', 'handle_bg_removal');
function handle_bg_removal() {
    check_ajax_referer('crystal_nonce', 'security');
    
    $image_data = $_POST['image']; // Base64 from JS
    $api_key = 'YOUR_REMOVE_BG_API_KEY';

    // Logic to send to API and return processed image
    // For now, we return the original or a success status
    wp_send_json_success(array('url' => $image_data)); 
}