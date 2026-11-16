import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hasCustomerKey } from "./apiConfig.js";
import BrandList from "./components/BrandList.jsx";
import Loader from "./components/Loader.jsx";
import OffersTable from "./components/OffersTable.jsx";
import { articleEdited, brandPicked, fetchBrands, fetchOffers } from "./store.js";

const SEARCH_DELAY_MS = 350;

export default function App() {
  const dispatch = useDispatch();
  const article = useSelector((state) => state.search.article);
  const articleQuery = useSelector((state) => state.search.articleQuery);
  const brandsStatus = useSelector((state) => state.search.brandsStatus);
  const brandsError = useSelector((state) => state.search.brandsError);
  const brands = useSelector((state) => state.search.brands);
  const selectedId = useSelector((state) => state.search.selectedId);
  const offersStatus = useSelector((state) => state.search.offersStatus);
  const offersError = useSelector((state) => state.search.offersError);
  const offers = useSelector((state) => state.search.offers);
  const brandsTask = useRef(null);
  const offersTask = useRef(null);
  const selected = brands.find((item) => item.id === selectedId) || null;
  const keyReady = hasCustomerKey();

  useEffect(() => {
    if (!articleQuery || !keyReady) return undefined;
    const timer = window.setTimeout(() => {
      if (brandsTask.current) brandsTask.current.abort();
      brandsTask.current = dispatch(fetchBrands(articleQuery));
    }, SEARCH_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      if (brandsTask.current) {
        brandsTask.current.abort();
        brandsTask.current = null;
      }
      if (offersTask.current) {
        offersTask.current.abort();
        offersTask.current = null;
      }
    };
  }, [articleQuery, dispatch, keyReady]);

  function onArticleChange(event) {
    dispatch(articleEdited(event.target.value));
  }

  function onBrandPick(item) {
    dispatch(brandPicked(item.id));
    if (offersTask.current) offersTask.current.abort();
    offersTask.current = dispatch(
      fetchOffers({
        id: item.id,
        number: item.number,
        brand: item.brand,
      }),
    );
  }

  return (
    <main className="container py-4 py-lg-5">
      <header className="mb-4">
        <h1 className="h3 mb-1">Проценка</h1>
        <p className="text-secondary mb-0">Артикул, производитель, аналоги и остатки по складам</p>
      </header>
      {keyReady ? null : (
        <div className="alert alert-warning" role="alert">
          Не задан ключ покупателя. Укажите customerKey в src/apiConfig.js — без него запрос к сервису не отправляется.
        </div>
      )}
      <section className="card shadow-sm mb-4">
        <div className="card-body">
          <form role="search" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="article" className="form-label">Артикул</label>
            <input
              id="article"
              className="form-control form-control-lg"
              value={article}
              onChange={onArticleChange}
              placeholder="Например, 01089"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="text"
            />
          </form>
          <div className="mt-3" aria-live="polite">
            {brandsStatus === "loading" ? <Loader label="Ищем производителей…" /> : null}
            {brandsStatus === "error" ? (
              <div className="alert alert-danger mb-0" role="alert">{brandsError}</div>
            ) : null}
            {brandsStatus === "empty" ? (
              <div className="alert alert-secondary mb-0" role="status">По этому артикулу производители не найдены.</div>
            ) : null}
            {brandsStatus === "idle" && articleQuery.length === 0 ? (
              <p className="text-secondary mb-0">Введите артикул, чтобы увидеть производителей.</p>
            ) : null}
            {brandsStatus === "ready" ? (
              <>
                <h2 className="h6">Производители для {articleQuery}</h2>
                <BrandList items={brands} selectedId={selectedId} onPick={onBrandPick} />
              </>
            ) : null}
          </div>
        </div>
      </section>
      {selected ? (
        <section className="card shadow-sm" aria-live="polite">
          <div className="card-body">
            <h2 className="h5 mb-1">Предложения и аналоги</h2>
            <p className="text-secondary mb-3">
              {selected.brand}
              {selected.number ? " · " + selected.number : ""}
              {selected.name ? " · " + selected.name : ""}
            </p>
            {offersStatus === "loading" ? <Loader label="Загружаем аналоги и предложения…" /> : null}
            {offersStatus === "error" ? (
              <div className="alert alert-danger mb-0" role="alert">{offersError}</div>
            ) : null}
            {offersStatus === "empty" ? (
              <div className="alert alert-secondary mb-0" role="status">Нет предложений и аналогов.</div>
            ) : null}
            {offersStatus === "ready" ? (
              <>
                <p className="text-secondary small">Цена и остаток взяты из склада.</p>
                <OffersTable rows={offers} />
              </>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
