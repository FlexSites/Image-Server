import { deferConfig as defer } from 'config/defer';
import url from 'url';

export default {
  env: 'development',
  port: '3000',
  aws: {
    region: 'us-west-2',
    s3: {
      region: defer(cfg => {
        return cfg.aws.region;
      }),
    },
  },
  isProd: defer(cfg => {
    return cfg.env === 'production';
  }),
  isDev: defer(cfg => {
    return cfg.env === 'development';
  }),
  isStage: defer(cfg => {
    return cfg.env === 'staging';
  }),
  isTest: defer(cfg => {
    return cfg.env === 'test';
  }),
  redis: {
    host: defer(cfg => {
      if (cfg.redis.url) return url.parse(cfg.redis.url).hostname;
    }),
    port: defer(cfg => {
      if (cfg.redis.url) return url.parse(cfg.redis.url).port;
    }),
    password: defer(cfg => {
      if (cfg.redis.url) return url.parse(cfg.redis.url).auth.split(':')[1];
    }),
  },
  devEmail: 'sethtippetts@gmail.com',
};
