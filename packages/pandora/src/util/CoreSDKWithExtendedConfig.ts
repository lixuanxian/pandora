import {CoreSDK, ICoreSDKOptions} from 'pandora-core-sdk';
import {dirname} from 'path';

export class CoreSDKWithExtendedConfig extends CoreSDK {
  constructor(options: ICoreSDKOptions) {
    if(!options.extendConfig) {
      options.extendConfig = [];
    }
    options.extendConfig.push({
      config: require('../pandoraConfig'),
      configDir: dirname(require.resolve('../pandoraConfig'))
    });
    for(const item of CoreSDKWithExtendedConfig.parsePandoraConfigFromEnvVar()) {
      options.extendConfig.push(item);
    }
    super(options);
  }

  static parsePandoraConfigFromEnvVar(): {config: string; configDir: string}[] {
    const PANDORA_CONFIG: string = process.env.PANDORA_CONFIG;
    const ret = [];
    if(!PANDORA_CONFIG) {
      return ret;
    }
    const paths = PANDORA_CONFIG.split(':');
    for(const path of paths) {
      try {
        ret.push({
          config: require(path),
          configDir: dirname(path)
        });
      } catch(err) {
        // pass
      }
    }
    return ret;
  }
}
