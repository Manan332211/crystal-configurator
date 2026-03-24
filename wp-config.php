<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'crystal-configurator' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', '123456' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'kLWjIBAXVgyusz1pFV8LTX:{|!YGNw8PGL%#MxTXSrvs>f7Zd#!.rL~nDS.M8nbQ' );
define( 'SECURE_AUTH_KEY',  '5PpIR^*QM&_aZb5`u8-8XG{r xvH4%(y7BEYtY1I-meW[@JVQZz)@:KmMX^+KC5!' );
define( 'LOGGED_IN_KEY',    '<B2$@m:&~5(qeS)S)*E+NJO5S8{/#QCszO0`v-oqXi>^v:}WJU!oHXp(:8/uNUpx' );
define( 'NONCE_KEY',        'GO}Dd?9l5kK~pv-A_c(P5_3?g;o.; *YZ8A}H^u<$rrD&xOOslgK4:g!~*:.B<F/' );
define( 'AUTH_SALT',        ',Q, [|!B(]Vdr/:bFpM5(:c71?}/w=59/Wt_~V#FgQmMMvIE63&%:@g$NS%mB?=y' );
define( 'SECURE_AUTH_SALT', '.aFlxU9nsE!TWbpo)0vhnV:L(r-Z?u;od ckLnMv}?yL)PQ6?MwOp^#iA~F$cD|c' );
define( 'LOGGED_IN_SALT',   'vw,s{<3G$qdN;hnr[,8@!W4)~G9%4W$&d^V9/:3)~wwUGk(]w)T!QV7vX(fZY{LC' );
define( 'NONCE_SALT',       'U)G5[BWf:1qMzoU:V:&2lzOT|{tSeJw779LhT3(tM5wH]FdKE(VpB@D;K2L_<tsD' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 *
 * At the installation time, database tables are created with the specified prefix.
 * Changing this value after WordPress is installed will make your site think
 * it has not been installed.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
