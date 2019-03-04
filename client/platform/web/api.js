import BaseAPI from 'baseAPI'

const Settings = JSON.parse(window.ANET_DATA.dictionary)
const API = BaseAPI

export {Settings, API as default}
