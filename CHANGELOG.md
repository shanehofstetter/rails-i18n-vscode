# Change Log

- add Mocha tests
- keep track of loaded translation files, removing deleted keys from memory

## 0.0.6
- use fallback strategies when rails calls fail
- reload translations when workspace changes
- evaluate I18n.load_path (configurable)

## 0.0.5
- support workspace with multiple folders
- call rails to get default locale configured for project

## 0.0.4
- Add Logging and configurable loglevel
- improve default locale detection with config file parsing strategy
- handle errors when loading yaml files (ignore invalid yaml files)

## 0.0.3
- Add suppor for slim templates

## 0.0.2
- Improve default locale detection

## 0.0.1
- Initial release