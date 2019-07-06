# Change Log

## 0.3.0
- improve i18n call detection regex (dashed keys)
- support block types in yaml
- support scalar types in yaml

## 0.2.0
- languages where translation info is provided can be configured via settings

## 0.1.0 
- updated depencies
- support ruby files

## 0.0.10
- fix translation loading, clone merged parts

## 0.0.9
- fix definition provider for flat (dot-separated) yaml keys

## 0.0.8
- provide key definition

## 0.0.7
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