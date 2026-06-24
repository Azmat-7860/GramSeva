const { withAndroidManifest } = require('@expo/config-plugins');

function withSendSms(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    const permissions = androidManifest.manifest['uses-permission'];
    const hasSmsPermission = permissions.some(
      (perm) =>
        perm['$']['android:name'] === 'android.permission.SEND_SMS'
    );

    if (!hasSmsPermission) {
      permissions.push({
        $: { 'android:name': 'android.permission.SEND_SMS' },
      });
    }

    return config;
  });
}

module.exports = withSendSms;
