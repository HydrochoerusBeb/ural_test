import { configureStore, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { hasCustomerKey } from "./apiConfig.js";
import { PriceError, loadGoods, toBrandChoices, toOfferRows } from "./priceApi.js";

function failureText(error) {
  if (error instanceof PriceError && error.message) return error.message;
  return "Не удалось связаться с сервером. Проверьте соединение и повторите запрос.";
}

export const fetchBrands = createAsyncThunk(
  "search/fetchBrands",
  async (number, { signal, rejectWithValue }) => {
    try {
      const goods = await loadGoods({ number }, signal);
      return toBrandChoices(goods);
    } catch (error) {
      if (error && error.name === "AbortError") throw error;
      return rejectWithValue(failureText(error));
    }
  },
  {
    condition(number, { getState }) {
      return Boolean(number) && getState().search.articleQuery === number && hasCustomerKey();
    },
  },
);

export const fetchOffers = createAsyncThunk(
  "search/fetchOffers",
  async (selection, { signal, rejectWithValue }) => {
    try {
      const goods = await loadGoods(
        { number: selection.number, brand: selection.brand, analogues: true },
        signal,
      );
      return toOfferRows(goods);
    } catch (error) {
      if (error && error.name === "AbortError") throw error;
      return rejectWithValue(failureText(error));
    }
  },
  {
    condition(selection, { getState }) {
      const state = getState().search;
      if (!selection || !selection.number || !selection.brand || !selection.id) return false;
      return state.selectedId === selection.id && state.articleQuery.length > 0 && hasCustomerKey();
    },
  },
);

const initialState = {
  article: "",
  articleQuery: "",
  brandsStatus: "idle",
  brandsError: "",
  brands: [],
  selectedId: "",
  offersStatus: "idle",
  offersError: "",
  offers: [],
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    articleEdited(state, action) {
      const article = String(action.payload ?? "");
      const query = article.trim();
      state.article = article;
      state.articleQuery = query;
      state.brands = [];
      state.brandsError = "";
      state.brandsStatus = query && hasCustomerKey() ? "loading" : "idle";
      state.selectedId = "";
      state.offers = [];
      state.offersError = "";
      state.offersStatus = "idle";
    },
    brandPicked(state, action) {
      state.selectedId = action.payload;
      state.offers = [];
      state.offersError = "";
      state.offersStatus = "loading";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchBrands.pending, (state, action) => {
        if (action.meta.arg !== state.articleQuery) return;
        state.brandsStatus = "loading";
        state.brandsError = "";
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        if (action.meta.arg !== state.articleQuery) return;
        state.brands = action.payload;
        state.brandsError = "";
        state.brandsStatus = action.payload.length > 0 ? "ready" : "empty";
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        if (action.meta.aborted || action.meta.condition) return;
        if (action.meta.arg !== state.articleQuery) return;
        state.brands = [];
        state.brandsStatus = "error";
        state.brandsError = action.payload || failureText(action.error);
      })
      .addCase(fetchOffers.pending, (state, action) => {
        if (!action.meta.arg || action.meta.arg.id !== state.selectedId) return;
        state.offersStatus = "loading";
        state.offersError = "";
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        if (!action.meta.arg || action.meta.arg.id !== state.selectedId) return;
        state.offers = action.payload;
        state.offersError = "";
        state.offersStatus = action.payload.length > 0 ? "ready" : "empty";
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        if (action.meta.aborted || action.meta.condition) return;
        if (!action.meta.arg || action.meta.arg.id !== state.selectedId) return;
        state.offers = [];
        state.offersStatus = "error";
        state.offersError = action.payload || failureText(action.error);
      });
  },
});

export const { articleEdited, brandPicked } = searchSlice.actions;

export const store = configureStore({
  reducer: {
    search: searchSlice.reducer,
  },
});
