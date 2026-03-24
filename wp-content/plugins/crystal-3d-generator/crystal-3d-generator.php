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

// AJAX Handler for Background Removal (Using remove.bg API)
add_action('wp_ajax_remove_background', 'handle_bg_removal');
add_action('wp_ajax_nopriv_remove_background', 'handle_bg_removal');
function handle_bg_removal() {
    check_ajax_referer('crystal_nonce', 'security');
    
    $image_data = $_POST['image']; // Base64 from JS
    // ALERT: User needs to replace this with their actual remove.bg API Key
    $api_key = 's2BLPZTKJcGyGxgcKweDMpSY'; 
    
    if (empty($api_key)) {
        wp_send_json_error('API Key is missing. Please add your remove.bg API key in crystal-3d-generator.php');
    }

    $base64_val = preg_replace('/^data:image\/\w+;base64,/', '', $image_data);

    $response = wp_remote_post('https://api.remove.bg/v1.0/removebg', array(
        'headers' => array(
            'X-Api-Key' => $api_key,
            'Content-Type' => 'application/json'
        ),
        'body' => wp_json_encode(array(
            'image_file_b64' => $base64_val,
            'size' => 'auto'
        )),
        'timeout' => 30
    ));

    if (is_wp_error($response)) {
        wp_send_json_error($response->get_error_message());
    }

    $status_code = wp_remote_retrieve_response_code($response);
    $body = wp_remote_retrieve_body($response);

    if ($status_code === 200) {
        $result_base64 = 'data:image/png;base64,' . base64_encode($body);
        wp_send_json_success(array('url' => $result_base64));
    } else {
        $err = json_decode($body, true);
        $error_msg = isset($err['errors'][0]['title']) ? $err['errors'][0]['title'] : 'API Error: ' . $status_code;
        wp_send_json_error($error_msg);
    }
}