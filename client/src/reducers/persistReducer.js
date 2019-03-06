import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'

import rootReducer from '.'

import { createTransform } from 'redux-persist'
import _cloneDeepWith from 'lodash/cloneDeepWith'
import _clone from 'lodash/clone'

const resolveToQuery = (value) => {
  if (typeof value === 'function') {
    return _clone(value())
  }
}

const SearchQueryTransform = createTransform(
  // transform state on its way to being serialized and persisted
  (inboundState, key) => {
    const filters = inboundState.filters ? _cloneDeepWith(inboundState.filters, resolveToQuery) : undefined
    return { ...inboundState, filters }
  },

  // transform state being rehydrated
  (outboundState, key) => {
    return { ...outboundState }
  },

  // define which reducers this transform gets called for
  { whitelist: ['searchQuery'] }
)

const persistConfig = {
  key: 'root',
  storage,
  stateReconciler: autoMergeLevel2,
  transforms: [SearchQueryTransform],
}

export default persistReducer(persistConfig, rootReducer)
