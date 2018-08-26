# Rails i18n

[![](https://vsmarketplacebadge.apphb.com/version/shanehofstetter.rails-i18n.svg
)](https://marketplace.visualstudio.com/items?itemName=shanehofstetter.rails-i18n)
[![](https://vsmarketplacebadge.apphb.com/installs-short/shanehofstetter.rails-i18n.svg
)](https://marketplace.visualstudio.com/items?itemName=shanehofstetter.rails-i18n)
[![](https://vsmarketplacebadge.apphb.com/rating-short/shanehofstetter.rails-i18n.svg
)](https://marketplace.visualstudio.com/items?itemName=shanehofstetter.rails-i18n)
[![](https://vsmarketplacebadge.apphb.com/trending-monthly/shanehofstetter.rails-i18n.svg
)](https://marketplace.visualstudio.com/items?itemName=shanehofstetter.rails-i18n)

Rails I18n helper for Visual Studio Code

## Features

- supported template languages: haml, erb and slim
- show translation (in default locale) when hovering over i18n keys in view files

![alt text](https://github.com/shanehofstetter/rails-i18n-vscode/raw/master/docs/hover.gif)

- provide autocompletion when typing i18n keys in view files

![alt text](https://github.com/shanehofstetter/rails-i18n-vscode/raw/master/docs/autocomplete.gif)

- supports multiple workspace folders

## Known Issues

- when removing keys from yaml files, the removed keys are still suggested in autocompletion
- RVM not supported

## Release Notes

## Roadmap
- [x] evaluate and parse all yaml files from `I18n.load_path`, use existing strategy as fallback 
- [ ] add a setting which when enabled shows translations in all available locales on hover
- [ ] go to location of translation in yaml file with go-to-definition
- [ ] go-to-definition does create key in yaml file if it does not already exist 
