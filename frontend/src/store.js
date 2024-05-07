import {combineReducers, configureStore} from "@reduxjs/toolkit";
import {thunk} from "redux-thunk";
import productsReducer from "./slices/productsSlice";


const reducer=combineReducers({
   produtsState: productsReducer
})

const store=configureStore({
    reducer,
    middleware:(getDefaultMiddleware)=> getDefaultMiddleware().concat(thunk),
})

export default store;