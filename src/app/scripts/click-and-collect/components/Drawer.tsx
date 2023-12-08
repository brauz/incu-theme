import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ScrollLock from "react-scrolllock";
import PlacesAutocomplete from "react-places-autocomplete";

import ChevronDown from "../../../icons/chevron-down.svg";
import Close from "../../../icons/close.svg";
import Pin from "../../../icons/map-pin.svg";
import Spinner from "../../../icons/spinner.svg";

import type * as Types from "../types";
import type { Props as CoreProps } from "./ClickAndCollect";

type Props = Omit<CoreProps, "cart" | "config"> & {
  active: boolean;
  cartItems: Array<Types.LineItem>;
  details: string | null;
  errors: Array<string>;
  handleAddToCart: (id: string) => void;
  handleUberDelivery: (id: string) => void;
  handleChange: (value: string) => void;
  handleDelivery: () => void;
  handleDetails: (id: string) => void;
  handleDrawer: () => void;
  handleGeolocate: () => void;
  handleSelection: (address: string, placeId?: string) => void;
  handleStore: (id: string) => void;
  handleSubmit: (event: any) => void;
  isProductPage: boolean;
  loading: boolean | string;
  position: Types.LatLng | null;
  setStore: (id: string | null) => void;
  search: string;
  searched: string;
  section?: Types.Section;
  store: string | null;
};

export const Drawer: React.FC<Props> = ({
  active,
  cartItems,
  details,
  errors,
  handleAddToCart,
  handleUberDelivery,
  handleChange,
  handleDelivery,
  handleDetails,
  handleDrawer,
  handleGeolocate,
  handleSelection,
  handleStore,
  handleSubmit,
  isProductPage,
  loading,
  locales,
  product,
  setStore,
  search,
  searched,
  section,
  store,
  stores,
  variant,
}) => {
  const field = useRef<HTMLInputElement>();
  const [unfulfillable, setUnfulfillable] = useState<boolean>(false);

  const selectedStore = useMemo(() => stores.find(({ id }) => id === store), [store, stores]);

  const highlightedStore = useMemo(() => stores.find(({ id }) => id === details), [details, stores]);

  const findSKUStock = useCallback(
    (stock: Array<Types.StoreStock>) => stock.find((storeStock) => storeStock.sku === variant?.sku)?.freeStock || 0,
    [variant?.sku]
  );

  const handleCollection = useCallback(
    (id: string) => {
      setUnfulfillable(false);

      if (!id) return;
      handleStore(id);
    },
    [handleStore]
  );

  const handleSelect = useCallback(
    (id: string) => {
      const selectedStore = stores.find((store) => id === store.id);

      if (isProductPage) {
        setStore(id);
      } else {
        setUnfulfillable(false);
        setStore(id);

        if (selectedStore?.stock?.length === cartItems.length) {
          handleStore(id);
        } else {
          setUnfulfillable(true);
        }
      }
    },
    [cartItems.length, handleStore, isProductPage, setUnfulfillable, setStore, stores]
  );

  const handleVariantChange = useCallback(
    (index, value) => {
      const form = document.querySelector(`product-variants[handle="${product?.handle}"]`);
      if (!form) return;

      const target = form.querySelector(`input[name="option${index}"][value="${value}"]`);
      if (!target) return;

      setStore(null);
      target.click();
    },
    [product?.handle, setStore]
  );

  const getVariant = useCallback(
    (index, value) => {
      if (!product?.variants?.length || !variant) return;

      return product.variants.find(
        ({ options }) =>
          options.filter((val, ind) => (ind === index ? val === value : val === variant.options[index])).length ===
          options.length - 1
      );
    },
    [product?.variants, variant]
  );

  const storeList = isProductPage
    ? [
        ...stores.filter(({ stock }) =>
          stock.find(() => findSKUStock(stock) > (section?.low_inventory_threshold || 0))
        ),
        ...stores.filter(({ stock }) =>
          stock.find(() => findSKUStock(stock) <= (section?.low_inventory_threshold || 0) && findSKUStock(stock) > 0)
        ),
        ...stores.filter(({ stock }) => !stock.find(() => findSKUStock(stock) > 0)),
      ]
    : [
        ...stores.filter(({ stock }) => stock.length === cartItems.length),
        ...stores.filter(({ stock }) => stock.length < cartItems.length && stock.length > 0),
        ...stores.filter(({ stock }) => stock.length === 0),
      ];

  const searchOptions = useMemo(
    () => ({
      componentRestrictions: {
        country: ["AU"],
      },
      types: ["(regions)"],
    }),
    []
  );
  
  const isBefore4PM = useCallback(
    () => {
      // Get the current date and time
      const currentDate = new Date();

      // Define the target time as 4:00 PM
      const targetTimeHours = 16; // 4 PM

      // Set the target time
      const targetTime = new Date(currentDate);
      targetTime.setHours(targetTimeHours, 0, 0, 0);

      // Compare the current time with the target time
      return currentDate < targetTime;
    },
    []
  );

  const showUberButton = useCallback(
    () => {
      const uberEnabled = selectedStore?.uberEnabled;

      // check if stock is 2 or more - start
      // const stock = selectedStore?.stock;

      // let isStockEligibleForUber = true;
      
      // if(!stock || Array.isArray(stock) === false || stock.length === 0 || findSKUStock(stock) < 2){
      //   isStockEligibleForUber = false;
      // }
      // check if stock is 2 or more - end

      // only show Uber button if:
      // 1. uberEnabled is true
      // 2. current time is before 4pm
      // 3. product tags don't contain "sale" and "exclude-uber"
      if(uberEnabled === true && isBefore4PM() && product && product.tags.indexOf("sale") === -1 && product.tags.indexOf("exclude-uber") === -1){
        return true;
      }

      return false;
    },
    [selectedStore, product]
  );

  useEffect(() => {
    if (active) setTimeout(() => field?.current?.focus(), 500);
  }, [active]);

  return (
    <>
      <div className="drawer drawer--large drawer--attached" open={active}>
        <span className="drawer__overlay" onClick={handleDrawer}></span>

        <header className="drawer__header">
          <p className="drawer__title heading h4">{isProductPage ? locales.find : locales.title}</p>

          <button className="drawer__close-button tap-area" onClick={handleDrawer} title="Close" type="button">
            <Close />
          </button>
        </header>

        <ScrollLock isActive={active}>
          <div className="drawer__content">
            {!highlightedStore && (
              <>
                {isProductPage && product && product.variants?.length > 1 && (
                  <div className="variants-wrapper">
                    <div className="variants">
                      {product.options_with_values
                        .filter(({ values }) => values.length > 1)
                        .map(({ index, name, values }) => (
                          <div key={name} className="input">
                            <select
                              className="input__select"
                              name="variant"
                              onChange={(event: React.BaseSyntheticEvent) =>
                                handleVariantChange(index, event.target.value)
                              }
                              value={variant[`option${index}`]}
                            >
                              {values.map((value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                            </select>
                            <ChevronDown />
                            {errors?.length > 0 && (
                              <div className="input__message">
                                {errors.map((error) => (
                                  <p key={error.toString()}>{error}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                <form className="location" onSubmit={handleSubmit}>
                  <div className="input">
                    <PlacesAutocomplete
                      onChange={handleChange}
                      onSelect={handleSelection}
                      searchOptions={searchOptions}
                      value={search}
                    >
                      {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                        <div>
                          <input
                            {...getInputProps({
                              autoComplete: "street-address",
                              disabled: loading === "location",
                              className: "input__field",
                              placeholder: locales.location,
                            })}
                            ref={field}
                          />
                          <>
                            {suggestions?.length > 0 && (
                              <div className="suggestions">
                                {suggestions.map((suggestion) => (
                                  <button {...getSuggestionItemProps(suggestion)}>{suggestion.description}</button>
                                ))}
                              </div>
                            )}
                          </>
                        </div>
                      )}
                    </PlacesAutocomplete>

                    {errors?.length > 0 && (
                      <div className="input__message">
                        {errors.map((error) => (
                          <p key={error.toString()}>{error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    className="button button--outline button--full"
                    disabled={loading === "location"}
                    onClick={handleGeolocate}
                    type="button"
                  >
                    {locales.geolocation}
                  </button>
                </form>
              </>
            )}
            <div className="drawer__content--inner">
              {highlightedStore ? (
                <div className="highlight">
                  <button className="link link--subdued" onClick={() => handleDetails(null)}>
                    {locales.store.back}
                  </button>

                  {highlightedStore.image && <img alt={highlightedStore.title} src={highlightedStore.image} />}

                  {isProductPage ? (
                    <p
                      className={`stock small caps${
                        findSKUStock(highlightedStore.stock) > (section?.low_inventory_threshold || 0)
                          ? " stock--complete"
                          : findSKUStock(highlightedStore.stock) <= (section?.low_inventory_threshold || 0) &&
                            findSKUStock(highlightedStore.stock) > 0
                          ? " stock--partial"
                          : ""
                      }`}
                    >
                      {findSKUStock(highlightedStore.stock) > (section?.low_inventory_threshold || 0)
                        ? locales.availability.available
                        : findSKUStock(highlightedStore.stock) <= (section?.low_inventory_threshold || 0) &&
                          findSKUStock(highlightedStore.stock) > 0
                        ? locales.availability.low
                        : locales.availability.unavailable}
                    </p>
                  ) : (
                    <p
                      className={`stock small caps${
                        highlightedStore.stock.length === cartItems.length
                          ? " stock--complete"
                          : highlightedStore.stock.length !== 0
                          ? " stock--partial"
                          : ""
                      }`}
                    >
                      {highlightedStore.stock.length === 0
                        ? locales.availability.unavailable
                        : locales.availability.amounts
                            .replace("{amount}", highlightedStore.stock.length)
                            .replace("{total}", cartItems.length)}
                    </p>
                  )}
                  <p className="h4">{highlightedStore.title}</p>
                  <p
                    className="small caps"
                    dangerouslySetInnerHTML={{
                      __html: highlightedStore.distance
                        ? locales.store.distance.replace("{distance}", highlightedStore.distance)
                        : "&nbsp;",
                    }}
                  />

                  <div className="highlight-information">
                    <div>
                      <p className="small">
                        {highlightedStore.address}
                        <br />
                        {highlightedStore.suburb}, {highlightedStore.state} {highlightedStore.postcode}
                      </p>
                      <a
                        href={`https://www.google.com/maps?saddr&daddr=${`${highlightedStore.address} ${highlightedStore.suburb} ${highlightedStore.state} ${highlightedStore.postcode}`
                          .replace(/(\r\n|\n|\r)/g, "+")
                          .replace(/,/g, "")
                          .replace(/ /g, "+")}`}
                        className="link link--subdued"
                        target="_blank"
                      >
                        {locales.store.directions}
                      </a>
                    </div>
                    <div>
                      <p className="small">{highlightedStore.hours}</p>
                    </div>
                  </div>

                  <div className={`highlight-footer${isProductPage ? " highlight-footer--left" : ""}`}>
                    {isProductPage ? (
                      <>
                        {product?.options_with_values
                          .filter(({ values }) => values.length > 1)
                          .map(({ index, name, values }) => (
                            <>
                              <div className="block-swatch-details">
                                <p className="small caps">
                                  {name.toLowerCase().includes("size") ? locales.store.size : name}
                                </p>
                                {findSKUStock(highlightedStore.stock) <= (section?.low_inventory_threshold || 0) &&
                                  findSKUStock(highlightedStore.stock) > 0 && (
                                    <p className={`stock stock--partial`}>
                                      {name.toLowerCase().includes("size")
                                        ? locales.store.units.replace("{units}", findSKUStock(highlightedStore.stock))
                                        : name}
                                    </p>
                                  )}
                              </div>

                              <div key={name} className="block-swatch-list">
                                {values.map((value) => {
                                  const currentVariant = getVariant(index - 1, value);

                                  return (
                                    <div
                                      key={value}
                                      className={`block-swatch${
                                        !highlightedStore.stock.find(({ sku }) => sku === currentVariant?.sku)
                                          ? " is-disabled"
                                          : ""
                                      }`}
                                    >
                                      <input
                                        className="block-swatch__radio visually-hidden"
                                        checked={currentVariant?.id === variant?.id}
                                        disabled={
                                          !highlightedStore.stock.find(({ sku }) => sku === currentVariant?.sku)
                                        }
                                        name={`option${index}`}
                                        readOnly
                                        type="radio"
                                        value={value}
                                      />
                                      <label
                                        className="block-swatch__item"
                                        onClick={() => handleVariantChange(index, value)}
                                      >
                                        {value}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ))}
                        <div className="block-swatch-callout">
                          <p>
                            <strong>{locales.store.in_store.title}</strong>
                          </p>
                          <p
                            dangerouslySetInnerHTML={{
                              __html: locales.store.in_store.subtitle.replace(
                                "{phone}",
                                `<br /><a href="tel:${highlightedStore.phone}">${highlightedStore.phone}</a>`
                              ),
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      highlightedStore.stock.length < cartItems.length && (
                        <>
                          <p>
                            <strong>
                              {locales.availability.unfulfillable[
                                highlightedStore.stock.length === 0 ? "empty" : "title"
                              ].replace("{store}", highlightedStore?.title || "")}
                              .
                            </strong>
                          </p>
                          <p>{locales.availability.unfulfillable.subtitle}</p>
                        </>
                      )
                    )}

                    <div className={`highlight-footer--actions${isProductPage ? " highlight-footer--border" : ""}`}>
                      <button
                        className={`button button--full button--${
                          highlightedStore.stock.length < cartItems.length ? "outline" : "primary"
                        }`}
                        disabled={highlightedStore.stock.length === 0 || (isProductPage && loading === "cart")}
                        onClick={
                          isProductPage
                            ? () => handleAddToCart(highlightedStore?.id)
                            : () => handleCollection(highlightedStore.id)
                        }
                      >
                        {locales.collect}
                      </button>
                      {!isProductPage && (
                        <button
                          className={`button button--full button--${
                            highlightedStore.stock.length < cartItems.length ? "primary" : "outline"
                          }`}
                          onClick={handleDelivery}
                        >
                          {locales.delivery}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {typeof loading === "string" && ["location", "stock"].includes(loading) ? (
                    <div className="spinner-wrapper">
                      <div className="spinner">
                        <Spinner />
                      </div>
                    </div>
                  ) : storeList?.length > 0 ? (
                    <div className="stores">
                      {storeList.map(({ address, distance, id, postcode, state, stock, suburb, title }) => (
                        <div key={id} className="store">
                          <div className="store-details">
                            <div className="store-information">
                              {isProductPage ? (
                                <p
                                  className={`stock small caps${
                                    findSKUStock(stock) > (section?.low_inventory_threshold || 0)
                                      ? " stock--complete"
                                      : findSKUStock(stock) <= (section?.low_inventory_threshold || 0) &&
                                        findSKUStock(stock) > 0
                                      ? " stock--partial"
                                      : ""
                                  }`}
                                >
                                  {findSKUStock(stock) > (section?.low_inventory_threshold || 0)
                                    ? locales.availability.available
                                    : findSKUStock(stock) <= (section?.low_inventory_threshold || 0) &&
                                      findSKUStock(stock) > 0
                                    ? locales.availability.low
                                    : locales.availability.unavailable}
                                </p>
                              ) : (
                                <p
                                  className={`stock small caps${
                                    stock.length === cartItems.length
                                      ? " stock--complete"
                                      : stock.length !== 0
                                      ? " stock--partial"
                                      : ""
                                  }`}
                                >
                                  {stock.length === 0
                                    ? locales.availability.unavailable
                                    : locales.availability.amounts
                                        .replace("{amount}", stock.length)
                                        .replace("{total}", cartItems.length)}
                                </p>
                              )}
                              <p>
                                <strong>{title}</strong>
                              </p>
                              <p className="small">
                                {address}
                                <br />
                                {suburb}, {state} {postcode}
                              </p>
                            </div>
                            <button className="link link--subdued" onClick={() => handleDetails(id)}>
                              {locales.store.details}
                            </button>
                          </div>
                          <div className="store-actions">
                            <p
                              className="small caps"
                              dangerouslySetInnerHTML={{
                                __html: distance ? locales.store.distance.replace("{distance}", distance) : "&nbsp;",
                              }}
                            />
                            {isProductPage ? (
                              <button
                                className={`button button--toggle${store === id ? " is-active" : ""}`}
                                disabled={findSKUStock(stock) === 0}
                                onClick={() => handleSelect(id)}
                              >
                                {store === id ? locales.store.selected : locales.store.select}
                              </button>
                            ) : (
                              <button
                                className={`button button--toggle${store === id ? " is-active" : ""}`}
                                disabled={stock.length === 0}
                                onClick={() => handleSelect(id)}
                              >
                                {store === id ? locales.store.selected : locales.store.select}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="stores--empty">
                      <Pin />
                      <p>
                        <strong>
                          {searched ? locales.empty.title.replace("{location}", searched) : locales.unsearched.title}
                        </strong>
                      </p>
                      <p>{searched ? locales.empty.subtitle : locales.unsearched.subtitle}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </ScrollLock>

        {store &&
          !highlightedStore &&
          (isProductPage ? (
            <footer className="drawer__footer">
              <div className="drawer-footer--actions">
                {showUberButton() &&
                  <button
                    className="button button--primary button--full"
                    disabled={loading === "cart"}
                    onClick={() => handleUberDelivery(store)}
                  >
                    {locales.uber_delivery}
                  </button>
                }

                <button
                  className="button button--primary button--full"
                  disabled={loading === "cart"}
                  onClick={() => handleAddToCart(store)}
                >
                  {locales.add_to_cart}
                </button>
              </div>
            </footer>
          ) : (
            !isProductPage &&
            unfulfillable && (
              <footer className="drawer__footer">
                <p>
                  <strong>
                    {locales.availability.unfulfillable.title.replace("{store}", selectedStore?.title || "")}.
                  </strong>
                </p>
                <p>{locales.availability.unfulfillable.subtitle}</p>

                <div className="drawer-footer--actions">
                  <button className="button button--outline button--full" onClick={() => handleCollection(store)}>
                    {locales.collect}
                  </button>
                  <button className="button button--primary button--full" onClick={handleDelivery}>
                    {locales.delivery}
                  </button>
                </div>
              </footer>
            )
          ))}
      </div>
    </>
  );
};
