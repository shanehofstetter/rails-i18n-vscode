# Rails i18n

[![Build Status](https://travis-ci.org/shanehofstetter/rails-i18n-vscode.svg?branch=master)](https://travis-ci.org/shanehofstetter/rails-i18n-vscode)
[![](https://vsmarketplacebadge.apphb.com/version/shanehofstetter.rails-i18n.svg
)](https://marketplace.visualstudio.com/items?itemName=shanehofstetter.rails-i18n)
[![](https://vsmarketplacebadge.apphb.com/installs-short/shanehofstetter.rails-i18n.svg
)](https://marketplace.visualstudio.com/items?itemName=shanehofstetter.rails-i18n)
[![](https://vsmarketplacebadge.apphb.com/downloads-short/shanehofstetter.rails-i18n.svg
)](https://marketplace.visualstudio.com/items?itemName=shanehofstetter.rails-i18n)
[![](https://vsmarketplacebadge.apphb.com/rating-short/shanehofstetter.rails-i18n.svg
)](https://marketplace.visualstudio.com/items?itemName=shanehofstetter.rails-i18n)
[![](https://vsmarketplacebadge.apphb.com/trending-monthly/shanehofstetter.rails-i18n.svg
)](https://marketplace.visualstudio.com/items?itemName=shanehofstetter.rails-i18n)

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate/?business=PB26QWEQQ3RE4&no_recurring=0&item_name=Support+my+open+source+work+on+github+%E2%9D%A4%EF%B8%8F&currency_code=USD)

Rails i18n helper for Visual Studio Code

## Features

- Default supported template languages: haml, erb and slim
  - others can be configured by adding the language identifier to the `railsI18n.languageIdentifiers` setting
- Shows translation (in configured default locale) when hovering over i18n keys

![alt text](https://github.com/shanehofstetter/rails-i18n-vscode/raw/master/docs/hover.gif)

- Provides autocompletion when typing i18n keys

![alt text](https://github.com/shanehofstetter/rails-i18n-vscode/raw/master/docs/autocomplete.gif)

- Supports multiple workspaces
- Evaluates and parses yaml files configured in `I18n.load_path` (turned off per default, turn it on by setting `railsI18n.loadAllTranslations` to `true`)
- Provides definition for i18n keys (Command '`Go To Definition`'  (<kbd>F12</kbd> or <kbd>⌘</kbd>+<kbd>↓</kbd>))

![alt text](https://github.com/shanehofstetter/rails-i18n-vscode/raw/master/docs/goto-definition.gif)

## Known Issues

- RVM not supported

## Release Notes

## Planned Features
- [ ] add a setting and feature to show translations of all available locales on hover
- [ ] go-to-definition creates key in yaml file if it does not already exist 
- [ ] copy dot-separated translation keys into clipboard from yaml file
