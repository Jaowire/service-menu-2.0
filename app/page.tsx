"use client";

import { useEffect, useMemo, useState } from "react";

type Step = 1 | 2 | 3;
type Toast = { message: string; tone?: "success" | "warning" } | null;

type Service = {
  id: string;
  name: string;
  shortName: string;
  dmsName: string;
  dueName: string;
  interval: number | null;
  price: number;
  detail: string;
  category: "Essential" | "Filter" | "Chassis" | "Fluid";
};

type ServicePackage = {
  id: "15k" | "20k" | "30k";
  eyebrow: string;
  title: string;
  detail: string;
  price: number;
  originalPrice: number;
  items: string[];
};

type CustomerDraft = {
  vin: string;
  customerName: string;
  phone: string;
  vehicle: string;
  mileage: string;
  staggered: boolean;
  oilInterval: 5000 | 7500;
  selectedPackage: ServicePackage["id"] | null;
  addOns: string[];
  declined: string[];
};

const TAX_RATE = 0.07;
const SHOP_RATE = 0.05;
const SHOP_CAP = 49.99;
const STORAGE_KEY = "taverna-service-consultation-v1";

const SERVICES: Service[] = [
  {
    id: "oil_rot",
    name: "Elite Oil Change & Tire Rotation",
    shortName: "Elite Oil Change",
    dmsName: "Elite Oil change and Tire rotation",
    dueName: "Oil change and tire rotation",
    interval: null,
    price: 189.99,
    detail: "Premium oil service, tire rotation and factory inspection.",
    category: "Essential",
  },
  {
    id: "engine_air",
    name: "Engine Air Filter Replacement",
    shortName: "Engine Air Filter",
    dmsName: "Engine Air Filter Replacement",
    dueName: "Engine air filter replacement",
    interval: 20000,
    price: 99.99,
    detail: "Helps protect performance and engine airflow.",
    category: "Filter",
  },
  {
    id: "cabin_air",
    name: "Cabin Air Filter Replacement",
    shortName: "Cabin Air Filter",
    dmsName: "Cabin Air Filter Replacement",
    dueName: "Cabin filter replacement",
    interval: 15000,
    price: 129.99,
    detail: "Supports cleaner airflow through the vehicle cabin.",
    category: "Filter",
  },
  {
    id: "wheel_bal",
    name: "Four-Wheel Balancing",
    shortName: "Wheel Balancing",
    dmsName: "4 Wheel Balancing",
    dueName: "4 wheel balancing",
    interval: 15000,
    price: 119.99,
    detail: "Balances all four wheel and tire assemblies for a smoother ride.",
    category: "Chassis",
  },
  {
    id: "alignment",
    name: "Computerized Four-Wheel Alignment",
    shortName: "Four-Wheel Alignment",
    dmsName: "4 Wheel Computerized Alignment",
    dueName: "4 wheel computerized alignment",
    interval: 15000,
    price: 174.99,
    detail: "Restores alignment angles to help handling and tire wear.",
    category: "Chassis",
  },
  {
    id: "brake_fluid",
    name: "Brake Fluid Replacement",
    shortName: "Brake Fluid",
    dmsName: "Brake Fluid Replacement",
    dueName: "Brake fluid replacement",
    interval: 20000,
    price: 169.99,
    detail: "Replaces aged fluid to support consistent braking response.",
    category: "Fluid",
  },
  {
    id: "induction",
    name: "Fuel Induction Service",
    shortName: "Induction Service",
    dmsName: "Induction Service",
    dueName: "Induction service",
    interval: 15000,
    price: 179.99,
    detail: "Cleans intake deposits to help maintain smooth performance.",
    category: "Essential",
  },
  {
    id: "coolant",
    name: "Coolant Drain & Fill Service",
    shortName: "Coolant Service",
    dmsName: "Coolant Drain and Fill Service",
    dueName: "Coolant service",
    interval: 30000,
    price: 214.99,
    detail: "Refreshes engine coolant and corrosion protection.",
    category: "Fluid",
  },
  {
    id: "trans",
    name: "Transmission Fluid Service",
    shortName: "Transmission Service",
    dmsName: "Transmission Fluid Service",
    dueName: "Transmission service",
    interval: 30000,
    price: 324.99,
    detail: "Replaces transmission fluid to support smooth operation.",
    category: "Fluid",
  },
];

const PACKAGES: ServicePackage[] = [
  {
    id: "15k",
    eyebrow: "Every 15,000 miles",
    title: "Essential Care",
    detail: "Ride quality, clean cabin air and confident tire wear.",
    price: 534.64,
    originalPrice: 619.96,
    items: ["oil_rot", "cabin_air", "wheel_bal", "alignment"],
  },
  {
    id: "20k",
    eyebrow: "Every 20,000 miles",
    title: "Performance Care",
    detail: "Fresh engine airflow and braking-system protection.",
    price: 396.97,
    originalPrice: 459.97,
    items: ["oil_rot", "engine_air", "brake_fluid"],
  },
  {
    id: "30k",
    eyebrow: "Every 30,000 miles",
    title: "Signature Care",
    detail: "A deeper fluid service for long-term refinement.",
    price: 719.99,
    originalPrice: 859.96,
    items: ["oil_rot", "cabin_air", "coolant", "trans"],
  },
];

const DEFAULT_DRAFT: CustomerDraft = {
  vin: "",
  customerName: "",
  phone: "",
  vehicle: "",
  mileage: "",
  staggered: false,
  oilInterval: 7500,
  selectedPackage: null,
  addOns: [],
  declined: [],
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

const formatMileage = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
};

function serviceName(service: Service, staggered: boolean) {
  return staggered && service.id === "oil_rot" ? service.shortName : service.name;
}

function dmsServiceName(service: Service, staggered: boolean) {
  return staggered && service.id === "oil_rot"
    ? "Elite Oil change"
    : service.dmsName;
}

function dueServiceName(service: Service, staggered: boolean) {
  return staggered && service.id === "oil_rot"
    ? "Oil change"
    : service.dueName;
}

const PACKAGE_NOTE_TITLES: Record<ServicePackage["id"], string> = {
  "15k": "15,000 MILE PACKAGE",
  "20k": "20,000 MILE PACKAGE",
  "30k": "30,000 MILE PACKAGE",
};

function suggestedPackage(mileage: number) {
  if (!mileage) return null;
  const intervals = [
    { miles: 30000, id: "30k" },
    { miles: 20000, id: "20k" },
    { miles: 15000, id: "15k" },
  ] as const;

  for (const interval of intervals) {
    const nearest = Math.round(mileage / interval.miles) * interval.miles;
    if (nearest > 0 && mileage >= nearest - 1500 && mileage <= nearest + 2500) {
      return interval.id;
    }
  }
  return null;
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<CustomerDraft>(DEFAULT_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft({ ...DEFAULT_DRAFT, ...JSON.parse(saved) });
    } catch {
      // A local draft is a convenience; the menu remains fully usable without it.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const chosenPackage = useMemo(
    () => PACKAGES.find((item) => item.id === draft.selectedPackage) ?? null,
    [draft.selectedPackage],
  );

  const includedIds = useMemo(
    () => new Set(chosenPackage?.items ?? []),
    [chosenPackage],
  );

  const addOnServices = useMemo(
    () => SERVICES.filter((service) => draft.addOns.includes(service.id)),
    [draft.addOns],
  );

  const declinedServices = useMemo(
    () => SERVICES.filter((service) => draft.declined.includes(service.id)),
    [draft.declined],
  );

  const allSelectedServices = useMemo(() => {
    const ids = new Set([...(chosenPackage?.items ?? []), ...draft.addOns]);
    return SERVICES.filter((service) => ids.has(service.id));
  }, [chosenPackage, draft.addOns]);

  const totals = useMemo(() => {
    const packagePrice = chosenPackage?.price ?? 0;
    const addOnSubtotal = addOnServices.reduce((sum, item) => sum + item.price, 0);
    const onlyOil =
      !chosenPackage &&
      addOnServices.length === 1 &&
      addOnServices[0].id === "oil_rot";
    const shopFee =
      chosenPackage || onlyOil
        ? 0
        : Math.min(addOnSubtotal * SHOP_RATE, SHOP_CAP);
    const tax = chosenPackage || onlyOil ? 0 : (addOnSubtotal + shopFee) * TAX_RATE;
    return {
      packagePrice,
      addOnSubtotal,
      subtotal: packagePrice + addOnSubtotal,
      shopFee,
      tax,
      total: packagePrice + addOnSubtotal + shopFee + tax,
      specialPricing: Boolean(chosenPackage || onlyOil),
    };
  }, [chosenPackage, addOnServices]);

  const mileageNumber = Number(draft.mileage.replace(/\D/g, "")) || 0;
  const suggested = suggestedPackage(mileageNumber);
  const hasSelection = allSelectedServices.length > 0;

  const updateDraft = <K extends keyof CustomerDraft>(
    key: K,
    value: CustomerDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const choosePackage = (id: ServicePackage["id"]) => {
    setDraft((current) => {
      const nextPackage = current.selectedPackage === id ? null : id;
      const nextIncluded = new Set(
        PACKAGES.find((item) => item.id === nextPackage)?.items ?? [],
      );
      return {
        ...current,
        selectedPackage: nextPackage,
        addOns: current.addOns.filter((serviceId) => !nextIncluded.has(serviceId)),
        declined: current.declined.filter(
          (serviceId) => !nextIncluded.has(serviceId),
        ),
      };
    });
  };

  const toggleService = (id: string) => {
    if (includedIds.has(id)) return;
    setDraft((current) => {
      const adding = !current.addOns.includes(id);
      return {
        ...current,
        addOns: adding
          ? [...current.addOns, id]
          : current.addOns.filter((item) => item !== id),
        declined: adding
          ? current.declined.filter((item) => item !== id)
          : current.declined,
      };
    });
  };

  const toggleDeclined = (id: string) => {
    if (includedIds.has(id) || draft.addOns.includes(id)) return;
    setDraft((current) => ({
      ...current,
      declined: current.declined.includes(id)
        ? current.declined.filter((item) => item !== id)
        : [...current.declined, id],
    }));
  };

  const decodeVin = async () => {
    const vin = draft.vin.trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      setToast({
        message: "Enter a valid 17-character VIN. I, O and Q are not used.",
        tone: "warning",
      });
      return;
    }

    setDecoding(true);
    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`,
      );
      if (!response.ok) throw new Error("VIN request failed");
      const data = (await response.json()) as {
        Results: { Variable: string; Value: string | null }[];
      };
      const result = Object.fromEntries(
        data.Results.map((item) => [item.Variable, item.Value ?? ""]),
      );
      if (!result.Make || !result.Model) throw new Error("VIN not decoded");

      const vehicle = [
        result["Model Year"],
        result.Make,
        result.Model,
        result.Trim,
      ]
        .filter(Boolean)
        .join(" ");
      const fitmentText = `${result.Trim ?? ""} ${result.Series ?? ""}`.toLowerCase();
      const staggered = fitmentText.includes("red sport");
      setDraft((current) => ({ ...current, vin, vehicle, staggered }));
      setToast({
        message: staggered
          ? "Vehicle decoded. Staggered fitment flagged."
          : "Vehicle decoded successfully.",
        tone: "success",
      });
    } catch {
      setToast({
        message: "VIN lookup is unavailable. You can enter the vehicle manually.",
        tone: "warning",
      });
    } finally {
      setDecoding(false);
    }
  };

  const writeClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: successMessage, tone: "success" });
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setToast({ message: successMessage, tone: "success" });
    }
  };

  const copyDmsNotes = () => {
    if (!hasSelection && declinedServices.length === 0) {
      setToast({
        message: "Select authorized or declined work first.",
        tone: "warning",
      });
      return;
    }

    const lines: string[] = [];

    if (chosenPackage) {
      lines.push(
        `${PACKAGE_NOTE_TITLES[chosenPackage.id]} INCLUDED SERVICES:`,
        ...chosenPackage.items.map((serviceId) => {
          const service = SERVICES.find((item) => item.id === serviceId)!;
          return ` - ${dmsServiceName(service, draft.staggered)}`;
        }),
      );
    }

    if (addOnServices.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push(
        chosenPackage ? "ADDITIONAL AUTHORIZED SERVICES:" : "AUTHORIZED SERVICES:",
        ...addOnServices.map(
          (service) => ` - ${dmsServiceName(service, draft.staggered)}`,
        ),
      );
    }

    if (declinedServices.length > 0) {
      if (lines.length > 0) lines.push("");
      lines.push(
        "CUSTOMER DECLINED:",
        ...declinedServices.map(
          (service) => ` - ${dmsServiceName(service, draft.staggered)}`,
        ),
      );
    }

    void writeClipboard(lines.join("\n"), "Reynolds-ready notes copied.");
  };

  const copyNextDueNotes = () => {
    if (!hasSelection) {
      setToast({ message: "Select performed services first.", tone: "warning" });
      return;
    }
    if (!mileageNumber) {
      setToast({
        message: "Enter the current mileage to calculate next due dates.",
        tone: "warning",
      });
      return;
    }

    const lines = allSelectedServices.map((service) => {
      const interval =
        service.id === "oil_rot" ? draft.oilInterval : service.interval;
      if (!interval) return null;
      const nextMileage = (mileageNumber + interval).toLocaleString("en-US");
      return `Next ${dueServiceName(service, draft.staggered)} due at ${nextMileage} Miles`;
    }).filter((line): line is string => line !== null);

    if (lines.length === 0) {
      setToast({
        message: "No next-service intervals are configured for this selection.",
        tone: "warning",
      });
      return;
    }

    void writeClipboard(lines.join("\n"), "Next-service notes copied.");
  };

  const copyTrackerRecord = () => {
    const services = allSelectedServices
      .map((service) => serviceName(service, draft.staggered))
      .join(", ");
    const lines = [
      `${draft.customerName || "Customer"} — ${draft.vehicle || "Vehicle"}`,
      `Phone: ${draft.phone || "Not entered"}`,
      `VIN: ${draft.vin || "Not entered"}`,
      `Mileage: ${formatMileage(draft.mileage) || "Not entered"}`,
      `Authorized: ${services || "No services selected"}`,
      `Estimate: ${money(totals.total)}`,
      "Status: Write-up complete / Awaiting dispatch",
    ];
    void writeClipboard(lines.join("\n"), "Tracker handoff copied.");
  };

  const enterPresentation = async () => {
    if (!hasSelection) {
      setToast({ message: "Select services before presenting.", tone: "warning" });
      return;
    }
    setPresentation(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Full screen is a bonus; the presentation overlay still opens.
    }
  };

  const exitPresentation = async () => {
    setPresentation(false);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore browser-specific full-screen exit errors.
      }
    }
  };

  const reset = () => {
    if (!window.confirm("Start a new customer? This clears the current draft.")) return;
    setDraft(DEFAULT_DRAFT);
    setStep(1);
    window.localStorage.removeItem(STORAGE_KEY);
    setToast({ message: "Ready for a new customer.", tone: "success" });
  };

  return (
    <main className="app-shell">
      <div className="atmosphere" aria-hidden="true">
        <div className="horizon" />
        <div className="light-pool light-pool-one" />
        <div className="light-pool light-pool-two" />
      </div>

      <header className="topbar">
        <button
          type="button"
          className="wordmark"
          onClick={() => setStep(1)}
          aria-label="Return to vehicle details"
        >
          <span className="wordmark-main">INFINITI</span>
          <span className="wordmark-sub">Taverna · North Miami</span>
        </button>
        <div className="topbar-actions">
          <span className="save-state">
            <i aria-hidden="true" />
            Draft saved on this device
          </span>
          <button type="button" className="quiet-button" onClick={reset}>
            New customer
          </button>
        </div>
      </header>

      <section className="hero">
        <p className="kicker">Personalized service consultation</p>
        <h1>A clearer path to<br />confident care.</h1>
        <p className="hero-copy">
          Build the right maintenance plan, present it with clarity, and move
          the approved work into your write-up in one clean flow.
        </p>
      </section>

      <nav className="stepper" aria-label="Consultation steps">
        {[
          { number: 1 as Step, title: "Vehicle", detail: "Know the customer" },
          { number: 2 as Step, title: "Services", detail: "Build the plan" },
          { number: 3 as Step, title: "Review", detail: "Present & hand off" },
        ].map((item) => (
          <button
            type="button"
            key={item.number}
            className={`step-item ${step === item.number ? "active" : ""} ${
              step > item.number ? "complete" : ""
            }`}
            onClick={() => setStep(item.number)}
            aria-current={step === item.number ? "step" : undefined}
          >
            <span className="step-number">
              {step > item.number ? "✓" : `0${item.number}`}
            </span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </span>
          </button>
        ))}
      </nav>

      <div className="workspace">
        {step === 1 && (
          <section className="panel vehicle-panel">
            <div className="panel-heading">
              <div>
                <p className="section-index">01 · Arrival</p>
                <h2>Customer & vehicle</h2>
              </div>
              <p>
                Start with the VIN. Vehicle details populate automatically when
                the decoder is available.
              </p>
            </div>

            <div className="form-grid">
              <label className="field field-wide">
                <span>VIN number</span>
                <div className="vin-control">
                  <input
                    value={draft.vin}
                    onChange={(event) =>
                      updateDraft("vin", event.target.value.toUpperCase().slice(0, 17))
                    }
                    placeholder="Enter 17-character VIN"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                  <button type="button" onClick={decodeVin} disabled={decoding}>
                    {decoding ? "Decoding…" : "Decode VIN"}
                  </button>
                </div>
                <small>{draft.vin.length}/17 characters</small>
              </label>

              <label className="field">
                <span>Customer name</span>
                <input
                  value={draft.customerName}
                  onChange={(event) => updateDraft("customerName", event.target.value)}
                  placeholder="First and last name"
                  autoComplete="name"
                />
              </label>

              <label className="field">
                <span>Phone number <em>optional</em></span>
                <input
                  value={draft.phone}
                  onChange={(event) => updateDraft("phone", event.target.value)}
                  placeholder="(305) 555-0100"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>

              <label className="field field-vehicle">
                <span>Vehicle</span>
                <input
                  value={draft.vehicle}
                  onChange={(event) => updateDraft("vehicle", event.target.value)}
                  placeholder="Year, make, model and trim"
                />
              </label>

              <label className="field field-mileage">
                <span>Mileage</span>
                <div className="mileage-control">
                  <input
                    value={formatMileage(draft.mileage)}
                    onChange={(event) =>
                      updateDraft("mileage", event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="42,500"
                    inputMode="numeric"
                  />
                  <b>MI</b>
                </div>
              </label>
            </div>

            <div className="fitment-row">
              <div>
                <strong>Staggered tire fitment</strong>
                <span>Removes tire rotation from applicable package language.</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.staggered}
                className={`switch ${draft.staggered ? "on" : ""}`}
                onClick={() => updateDraft("staggered", !draft.staggered)}
              >
                <span />
                <b>{draft.staggered ? "Yes" : "No"}</b>
              </button>
            </div>

            <div className="interval-row">
              <div>
                <strong>Oil service interval</strong>
                <span>
                  Used only when creating the customer&apos;s next-service notes.
                </span>
              </div>
              <div className="interval-options" role="group" aria-label="Oil service interval">
                <button
                  type="button"
                  className={draft.oilInterval === 7500 ? "active" : ""}
                  aria-pressed={draft.oilInterval === 7500}
                  onClick={() => updateDraft("oilInterval", 7500)}
                >
                  <strong>7,500 miles</strong>
                  <small>Newer model</small>
                </button>
                <button
                  type="button"
                  className={draft.oilInterval === 5000 ? "active" : ""}
                  aria-pressed={draft.oilInterval === 5000}
                  onClick={() => updateDraft("oilInterval", 5000)}
                >
                  <strong>5,000 miles</strong>
                  <small>Older model</small>
                </button>
              </div>
            </div>

            <div className="panel-footer">
              <p>
                <span className="privacy-mark">◇</span>
                Customer information stays in this browser unless you copy or print it.
              </p>
              <button type="button" className="primary-button" onClick={() => setStep(2)}>
                Build service plan <span>→</span>
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="service-workspace">
            <div className="service-main">
              <div className="panel-heading package-heading">
                <div>
                  <p className="section-index">02 · Recommendation</p>
                  <h2>Choose a care plan</h2>
                </div>
                <p>
                  Package pricing reflects the menu you provided. Confirm
                  maintenance history before presenting a recommendation.
                </p>
              </div>

              <div className="package-grid">
                {PACKAGES.map((pkg) => {
                  const selected = draft.selectedPackage === pkg.id;
                  const isSuggested = suggested === pkg.id;
                  return (
                    <article
                      key={pkg.id}
                      className={`package-card ${selected ? "selected" : ""}`}
                    >
                      <div className="package-topline">
                        <span>{pkg.eyebrow}</span>
                        {isSuggested && <b>Suggested</b>}
                      </div>
                      <h3>{pkg.title}</h3>
                      <p>{pkg.detail}</p>
                      <ul>
                        {pkg.items.map((serviceId) => {
                          const service = SERVICES.find((item) => item.id === serviceId)!;
                          return (
                            <li key={serviceId}>
                              <span>✓</span>
                              {serviceName(service, draft.staggered)}
                            </li>
                          );
                        })}
                        <li><span>✓</span>Factory inspections & brake check</li>
                      </ul>
                      <div className="package-price">
                        <div>
                          <s>{money(pkg.originalPrice)}</s>
                          <strong>{money(pkg.price)}</strong>
                        </div>
                        <span>special package total</span>
                      </div>
                      <button
                        type="button"
                        className={selected ? "selected-button" : ""}
                        onClick={() => choosePackage(pkg.id)}
                      >
                        {selected ? "✓ Plan selected" : "Select this plan"}
                      </button>
                    </article>
                  );
                })}
              </div>

              {suggested && (
                <p className="suggestion-note">
                  <span>◇</span>
                  Suggested from the entered mileage. Verify prior service history
                  and model-specific requirements.
                </p>
              )}

              <div className="individual-heading">
                <div>
                  <p className="section-index">Customize</p>
                  <h2>Add individual services</h2>
                </div>
                <span>{draft.addOns.length} added</span>
              </div>

              <div className="service-list">
                {SERVICES.map((service) => {
                  const included = includedIds.has(service.id);
                  const selected = draft.addOns.includes(service.id);
                  return (
                    <button
                      type="button"
                      key={service.id}
                      className={`service-row ${selected ? "selected" : ""} ${
                        included ? "included" : ""
                      }`}
                      onClick={() => toggleService(service.id)}
                      disabled={included}
                    >
                      <span className="service-check">
                        {selected || included ? "✓" : "+"}
                      </span>
                      <span className="service-copy">
                        <strong>{serviceName(service, draft.staggered)}</strong>
                        <small>{included ? "Included in selected plan" : service.detail}</small>
                      </span>
                      <span className="service-category">{service.category}</span>
                      <b>{included ? "Included" : money(service.price)}</b>
                    </button>
                  );
                })}
              </div>

              <div className="declined-heading">
                <div>
                  <p className="section-index">Advisor only</p>
                  <h2>Declined work</h2>
                  <p>
                    Mark recommendations the customer declined. These appear only
                    in the Reynolds notes—not in the customer presentation or total.
                  </p>
                </div>
                <span>{draft.declined.length} declined</span>
              </div>

              <div className="declined-list">
                {SERVICES.map((service) => {
                  const authorized =
                    includedIds.has(service.id) || draft.addOns.includes(service.id);
                  const declined = draft.declined.includes(service.id);
                  return (
                    <button
                      type="button"
                      key={service.id}
                      className={`declined-row ${declined ? "selected" : ""}`}
                      onClick={() => toggleDeclined(service.id)}
                      disabled={authorized}
                      aria-pressed={declined}
                    >
                      <span className="declined-check">{declined ? "✓" : "+"}</span>
                      <span>
                        <strong>{serviceName(service, draft.staggered)}</strong>
                        <small>
                          {authorized ? "Already included as authorized work" : "Add to declined notes"}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="quote-rail">
              <p className="section-index">Live estimate</p>
              <div className="quote-customer">
                <span>{draft.customerName || "Customer"}</span>
                <strong>{draft.vehicle || "Vehicle not entered"}</strong>
                <small>
                  {formatMileage(draft.mileage)
                    ? `${formatMileage(draft.mileage)} miles`
                    : "Mileage not entered"}
                </small>
              </div>
              <div className="quote-lines">
                {chosenPackage && (
                  <div>
                    <span>{chosenPackage.title}</span>
                    <b>{money(chosenPackage.price)}</b>
                  </div>
                )}
                {addOnServices.map((service) => (
                  <div key={service.id}>
                    <span>{service.shortName}</span>
                    <b>{money(service.price)}</b>
                  </div>
                ))}
                {!hasSelection && (
                  <p className="empty-quote">Your selected plan will appear here.</p>
                )}
              </div>
              <div className="quote-total">
                <span>Estimated total</span>
                <strong>{money(totals.total)}</strong>
                <small>
                  {totals.specialPricing
                    ? "Special flat-rate pricing applied"
                    : "Includes estimated tax and shop supplies"}
                </small>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => setStep(3)}
                disabled={!hasSelection}
              >
                Review with customer <span>→</span>
              </button>
              <button type="button" className="back-button" onClick={() => setStep(1)}>
                ← Back to vehicle
              </button>
            </aside>
          </section>
        )}

        {step === 3 && (
          <section className="review-workspace">
            <div className="review-card">
              <div className="review-intro">
                <div>
                  <p className="section-index">03 · Review</p>
                  <h2>Your personalized<br />service plan</h2>
                  <p>
                    A clear summary for {draft.customerName || "your customer"}.
                    Present it, print it, or move the approved work into the RO.
                  </p>
                </div>
                <div className="vehicle-badge">
                  <span>{draft.vehicle || "Vehicle"}</span>
                  <strong>{formatMileage(draft.mileage) || "—"} MI</strong>
                  <small>VIN {draft.vin ? `••••${draft.vin.slice(-6)}` : "not entered"}</small>
                </div>
              </div>

              <div className="review-selections">
                {chosenPackage && (
                  <div className="review-package">
                    <div className="review-number">01</div>
                    <div>
                      <span>{chosenPackage.eyebrow}</span>
                      <h3>{chosenPackage.title}</h3>
                      <p>{chosenPackage.detail}</p>
                      <ul>
                        {chosenPackage.items.map((id) => {
                          const service = SERVICES.find((item) => item.id === id)!;
                          return <li key={id}>{serviceName(service, draft.staggered)}</li>;
                        })}
                      </ul>
                    </div>
                    <strong>{money(chosenPackage.price)}</strong>
                  </div>
                )}

                {addOnServices.map((service, index) => (
                  <div className="review-service" key={service.id}>
                    <div className="review-number">
                      {String(index + (chosenPackage ? 2 : 1)).padStart(2, "0")}
                    </div>
                    <div>
                      <span>Individual service</span>
                      <h3>{serviceName(service, draft.staggered)}</h3>
                      <p>{service.detail}</p>
                    </div>
                    <strong>{money(service.price)}</strong>
                  </div>
                ))}
              </div>

              {!hasSelection && (
                <div className="review-empty">
                  <p>No services selected yet.</p>
                  <button type="button" onClick={() => setStep(2)}>
                    Build a service plan
                  </button>
                </div>
              )}

              <div className="estimate-breakdown">
                <div>
                  <span>Services subtotal</span>
                  <b>{money(totals.subtotal)}</b>
                </div>
                <div>
                  <span>Shop supplies & hazmat</span>
                  <b>{money(totals.shopFee)}</b>
                </div>
                <div>
                  <span>Estimated Florida sales tax</span>
                  <b>{money(totals.tax)}</b>
                </div>
                <div className="estimate-grand">
                  <span>Today&apos;s estimated total</span>
                  <strong>{money(totals.total)}</strong>
                </div>
                <small>
                  Package and standalone Elite Oil Service totals use the flat-rate
                  pricing rules supplied by the retailer.
                </small>
              </div>
            </div>

            <aside className="handoff-card">
              <p className="section-index">Advisor actions</p>
              <h2>Ready for the next step.</h2>
              <p className="handoff-copy">
                Present the plan first. Once approved, copy a clean technician
                note directly into Reynolds.
              </p>
              <button
                type="button"
                className="presentation-button"
                onClick={enterPresentation}
                disabled={!hasSelection}
              >
                <span className="action-icon">▱</span>
                <span>
                  <strong>Customer presentation</strong>
                  <small>Full-screen, customer-safe view</small>
                </span>
                <b>→</b>
              </button>
              <button type="button" className="action-button" onClick={copyDmsNotes}>
                <span className="action-icon">⌘</span>
                <span>
                  <strong>Copy Reynolds notes</strong>
                  <small>Authorized and declined services</small>
                </span>
                <b>→</b>
              </button>
              <button type="button" className="action-button" onClick={copyNextDueNotes}>
                <span className="action-icon">◷</span>
                <span>
                  <strong>Copy next-service notes</strong>
                  <small>Future mileage reminders for the RO</small>
                </span>
                <b>→</b>
              </button>
              <button type="button" className="action-button" onClick={() => window.print()}>
                <span className="action-icon">▤</span>
                <span>
                  <strong>Print customer copy</strong>
                  <small>Quote and authorization line</small>
                </span>
                <b>→</b>
              </button>
              <button type="button" className="action-button" onClick={copyTrackerRecord}>
                <span className="action-icon">↗</span>
                <span>
                  <strong>Copy tracker handoff</strong>
                  <small>Ready for Google Form or Trello</small>
                </span>
                <b>→</b>
              </button>
              <button type="button" className="back-button" onClick={() => setStep(2)}>
                ← Adjust services
              </button>
            </aside>
          </section>
        )}
      </div>

      <footer className="site-footer">
        <div>
          <span className="footer-wordmark">INFINITI</span>
          <p>Taverna INFINITI · Service Consultation</p>
        </div>
        <p>3801 S State Road 7 · West Park, FL 33023</p>
      </footer>

      <section className="print-sheet" aria-hidden="true">
        <div className="print-brand">
          <strong>INFINITI</strong>
          <span>Taverna · North Miami</span>
        </div>
        <h1>Personalized Service Plan</h1>
        <div className="print-meta">
          <p><b>Customer</b>{draft.customerName || "—"}</p>
          <p><b>Vehicle</b>{draft.vehicle || "—"}</p>
          <p><b>Mileage</b>{formatMileage(draft.mileage) || "—"}</p>
          <p><b>VIN</b>{draft.vin || "—"}</p>
        </div>
        <table>
          <thead>
            <tr><th>Authorized service</th><th>Price</th></tr>
          </thead>
          <tbody>
            {chosenPackage && (
              <tr>
                <td>
                  <strong>{chosenPackage.title} · {chosenPackage.eyebrow}</strong>
                  <span>
                    {chosenPackage.items
                      .map((id) =>
                        serviceName(SERVICES.find((item) => item.id === id)!, draft.staggered),
                      )
                      .join(" · ")}
                  </span>
                </td>
                <td>{money(chosenPackage.price)}</td>
              </tr>
            )}
            {addOnServices.map((service) => (
              <tr key={service.id}>
                <td>{serviceName(service, draft.staggered)}</td>
                <td>{money(service.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="print-totals">
          <p><span>Services subtotal</span><b>{money(totals.subtotal)}</b></p>
          <p><span>Shop supplies & hazmat</span><b>{money(totals.shopFee)}</b></p>
          <p><span>Estimated sales tax</span><b>{money(totals.tax)}</b></p>
          <p><span>Estimated total</span><strong>{money(totals.total)}</strong></p>
        </div>
        <div className="signature">
          <span>Customer authorization signature</span>
          <span>Date</span>
        </div>
        <small className="print-disclaimer">
          Estimate based on selected menu services. Additional repairs require
          separate authorization. Model-specific maintenance requirements may vary.
        </small>
      </section>

      {presentation && (
        <section className="presentation" role="dialog" aria-modal="true">
          <div className="presentation-glow" aria-hidden="true" />
          <header>
            <div className="wordmark">
              <span className="wordmark-main">INFINITI</span>
              <span className="wordmark-sub">Taverna · North Miami</span>
            </div>
            <button type="button" onClick={exitPresentation}>Exit presentation ×</button>
          </header>
          <div className="presentation-content">
            <div className="presentation-title">
              <p>Prepared for {draft.customerName || "you"}</p>
              <h2>Care designed around<br />your INFINITI.</h2>
              <div>
                <span>{draft.vehicle || "Your vehicle"}</span>
                <span>{formatMileage(draft.mileage) || "—"} miles</span>
              </div>
            </div>
            <div className="presentation-plan">
              <p>Today&apos;s service plan</p>
              {chosenPackage && (
                <article>
                  <span>{chosenPackage.eyebrow}</span>
                  <h3>{chosenPackage.title}</h3>
                  <ul>
                    {chosenPackage.items.map((id) => {
                      const service = SERVICES.find((item) => item.id === id)!;
                      return <li key={id}>✓ {serviceName(service, draft.staggered)}</li>;
                    })}
                  </ul>
                  <b>{money(chosenPackage.price)}</b>
                </article>
              )}
              {addOnServices.map((service) => (
                <article className="presentation-addon" key={service.id}>
                  <div>
                    <span>Additional care</span>
                    <h3>{serviceName(service, draft.staggered)}</h3>
                    <p>{service.detail}</p>
                  </div>
                  <b>{money(service.price)}</b>
                </article>
              ))}
              <div className="presentation-total">
                <span>Your estimated total</span>
                <strong>{money(totals.total)}</strong>
                <small>Clear pricing. No surprises.</small>
              </div>
            </div>
          </div>
          <footer>
            <span>Thoughtful care for every mile ahead.</span>
            <small>Estimate subject to vehicle inspection and final authorization.</small>
          </footer>
        </section>
      )}

      {toast && (
        <div className={`toast ${toast.tone ?? "success"}`} role="status">
          <span>{toast.tone === "warning" ? "!" : "✓"}</span>
          {toast.message}
        </div>
      )}
    </main>
  );
}
