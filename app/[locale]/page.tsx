"use client"

import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { CardDescription } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Smartphone, Calculator, TrendingDown, Github, ShoppingCart } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTranslations, useLocale } from "next-intl"
import { LanguageSwitcher } from "@/components/language-switcher"

interface CalculatorInputs {
  P_buy: number
  T: number
  r: number
  model_depreciation: "exponential" | "linear" | "tiered"
  linear_d: number
  fee_pct: number
  cost_ship: number
  C_maint_yearly: number
  C_battery_oneoff: number
  use_tradein: boolean
  alpha_tradein: number
  discount_rate: number
  purchase_mode: "new" | "used"
}

interface CalculatorResults {
  priceAtT: number
  resaleNet: number
  totalCost: number
  annualCost: number
  monthlyCost: number
  npvTotalCost: number | null
}

interface iPhoneModel {
  name: string
  basePrice: number
  proPrice: number
  depreciationRate: number
  proAdjustment: number
  usedBasePrice: number
  usedProPrice: number
}

interface iPhoneAirModel {
  name: string
  basePrice: number
  depreciationRate: number
  usedBasePrice: number
}

interface AndroidModel {
  name: string
  basePrice: number
  proPrice?: number
  depreciationRate: number
  proAdjustment: number
  usedBasePrice: number
  usedProPrice?: number
  category: "flagship" | "mid" | "budget"
}

const iPhoneModels: iPhoneModel[] = [
  {
    name: "iPhone 12",
    basePrice: 26900,
    proPrice: 33900,
    depreciationRate: 0.438,
    proAdjustment: -0.06,
    usedBasePrice: 10000,
    usedProPrice: 13000,
  },
  {
    name: "iPhone 13",
    basePrice: 24900,
    proPrice: 31900,
    depreciationRate: 0.462,
    proAdjustment: -0.06,
    usedBasePrice: 13000,
    usedProPrice: 16000,
  },
  {
    name: "iPhone 14",
    basePrice: 27900,
    proPrice: 34900,
    depreciationRate: 0.477,
    proAdjustment: -0.06,
    usedBasePrice: 16500,
    usedProPrice: 20000,
  },
  {
    name: "iPhone 15",
    basePrice: 29900,
    proPrice: 36900,
    depreciationRate: 0.482,
    proAdjustment: -0.06,
    usedBasePrice: 20000,
    usedProPrice: 24000,
  },
  {
    name: "iPhone 16",
    basePrice: 30900,
    proPrice: 37900,
    depreciationRate: 0.45,
    proAdjustment: -0.06,
    usedBasePrice: 23000,
    usedProPrice: 27000,
  },
  {
    name: "iPhone 17",
    basePrice: 29900,
    proPrice: 39900,
    depreciationRate: 0.45,
    proAdjustment: -0.06,
    usedBasePrice: 26000,
    usedProPrice: 34000,
  },
]

const iPhoneAirModels: iPhoneAirModel[] = [
  {
    name: "iPhone Air",
    basePrice: 36900,
    depreciationRate: 0.45,
    usedBasePrice: 32000,
  },
]

const androidModels: AndroidModel[] = [
  {
    name: "Galaxy S24",
    basePrice: 28900,
    proPrice: 35900,
    depreciationRate: 0.6,
    proAdjustment: -0.05,
    usedBasePrice: 18000,
    usedProPrice: 22000,
    category: "flagship",
  },
  {
    name: "Galaxy S23",
    basePrice: 25900,
    proPrice: 32900,
    depreciationRate: 0.6,
    proAdjustment: -0.05,
    usedBasePrice: 14500,
    usedProPrice: 18000,
    category: "flagship",
  },
  {
    name: "Pixel 8",
    basePrice: 24900,
    proPrice: 31900,
    depreciationRate: 0.55,
    proAdjustment: -0.05,
    usedBasePrice: 13500,
    usedProPrice: 17000,
    category: "flagship",
  },
  {
    name: "Pixel 7",
    basePrice: 19900,
    proPrice: 26900,
    depreciationRate: 0.55,
    proAdjustment: -0.05,
    usedBasePrice: 10500,
    usedProPrice: 13500,
    category: "flagship",
  },
  {
    name: "OnePlus 12",
    basePrice: 22900,
    depreciationRate: 0.5,
    proAdjustment: 0,
    usedBasePrice: 13000,
    category: "flagship",
  },
]

function priceAfterYearsExp(P_buy: number, r: number, years: number): number {
  return P_buy * Math.pow(1 - r, years)
}

function priceAfterYearsLinear(P_buy: number, d: number, years: number): number {
  return Math.max(0, P_buy - d * years)
}

function priceAfterYearsTiered(P_buy: number, years: number): number {
  let currentPrice = P_buy

  for (let year = 1; year <= years; year++) {
    let yearlyRate: number

    if (year === 1) {
      yearlyRate = 0.45
    } else if (year === 2) {
      yearlyRate = 0.25
    } else {
      yearlyRate = 0.1
    }

    currentPrice = currentPrice * (1 - yearlyRate)
  }

  return currentPrice
}

function netResalePrice_market(P_t: number, fee_pct: number, cost_ship: number): number {
  return P_t * (1 - fee_pct) - cost_ship
}

function netResalePrice_tradein(P_t: number, alpha_tradein: number, cost_ship_tradein: number): number {
  return P_t * alpha_tradein - cost_ship_tradein
}

function totalCostHold(params: CalculatorInputs): CalculatorResults {
  const {
    P_buy,
    T,
    r,
    model_depreciation,
    linear_d,
    fee_pct,
    cost_ship,
    C_maint_yearly = 0,
    C_battery_oneoff = 0,
    use_tradein = false,
    alpha_tradein = 1.0,
    discount_rate = 0,
  } = params

  let P_t: number
  if (model_depreciation === "exponential") {
    P_t = priceAfterYearsExp(P_buy, r, T)
  } else if (model_depreciation === "linear") {
    P_t = priceAfterYearsLinear(P_buy, linear_d, T)
  } else {
    P_t = priceAfterYearsTiered(P_buy, T)
  }

  const R_net = use_tradein
    ? netResalePrice_tradein(P_t, alpha_tradein, cost_ship)
    : netResalePrice_market(P_t, fee_pct, cost_ship)

  const total = P_buy - R_net + T * C_maint_yearly + C_battery_oneoff
  const annual = T > 0 ? total / T : total
  const monthly = annual / 12

  let npvTotalCost = null
  if (discount_rate && discount_rate > 0) {
    const pvRnet = R_net / Math.pow(1 + discount_rate, T)
    let pvMaint = 0
    for (let i = 0; i < T; i++) {
      pvMaint += C_maint_yearly / Math.pow(1 + discount_rate, i + 1)
    }
    npvTotalCost = P_buy - pvRnet + pvMaint + C_battery_oneoff
  }

  return {
    priceAtT: P_t,
    resaleNet: R_net,
    totalCost: total,
    annualCost: annual,
    monthlyCost: monthly,
    npvTotalCost,
  }
}

// Currency conversion rates (approximation, TWD as baseline)
const CURRENCY_RATES = {
  "zh-TW": { currency: "TWD", rate: 1, symbol: "NT$", defaultShipping: 200 },
  en: { currency: "USD", rate: 0.032, symbol: "$", defaultShipping: 7 }, // ~200 TWD ≈ 7 USD
  ja: { currency: "JPY", rate: 4.7, symbol: "¥", defaultShipping: 950 }, // ~200 TWD ≈ 950 JPY
}

export default function PhoneCalculator() {
  const t = useTranslations()
  const locale = useLocale()

  const [inputs, setInputs] = useState<CalculatorInputs>({
    P_buy: 30000,
    T: 3,
    r: 0.15,
    model_depreciation: "tiered",
    linear_d: 5000,
    fee_pct: 0.03,
    cost_ship: 200,
    C_maint_yearly: 0,
    C_battery_oneoff: 0,
    use_tradein: false,
    alpha_tradein: 0.6,
    discount_rate: 0,
    purchase_mode: "used",
  })

  const [phoneType, setPhoneType] = useState<"iphone" | "android">("iphone")
  const [selectedModel, setSelectedModel] = useState<string>("iPhone 12")
  const [purchaseMode, setPurchaseMode] = useState<"new" | "used">("used")
  const [isProModel, setIsProModel] = useState<boolean>(false)
  const [results, setResults] = useState<CalculatorResults | null>(null)

  useEffect(() => {
    const calculatedResults = totalCostHold(inputs)
    setResults(calculatedResults)
  }, [inputs])

  const handleInputChange = (field: keyof CalculatorInputs, value: any) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
  }

  const handlePurchaseModeChange = (mode: "new" | "used") => {
    setInputs((prev) => ({
      ...prev,
      purchase_mode: mode,
      model_depreciation: mode === "used" ? "exponential" : "tiered",
      r: mode === "used" ? 0.1 : prev.r,
    }))
    setPurchaseMode(mode)
  }

  const applyiPhoneModel = (modelName: string, isPro: boolean) => {
    const model = iPhoneModels.find((m) => m.name === modelName)
    if (model) {
      const price =
        inputs.purchase_mode === "new"
          ? isPro
            ? model.proPrice
            : model.basePrice
          : isPro
            ? model.usedProPrice
            : model.usedBasePrice
      const depreciationRate = isPro ? model.depreciationRate + model.proAdjustment : model.depreciationRate

      setInputs((prev) => ({
        ...prev,
        P_buy: price,
        r: inputs.purchase_mode === "used" ? 0.1 : depreciationRate,
        model_depreciation: inputs.purchase_mode === "used" ? "exponential" : "tiered",
        fee_pct: 0.03,
        cost_ship: 200,
        use_tradein: false,
      }))
      setSelectedModel(modelName)
      setIsProModel(isPro)
    }
  }

  const applyiPhoneAirModel = (modelName: string) => {
    const model = iPhoneAirModels.find((m) => m.name === modelName)
    if (model) {
      const price = inputs.purchase_mode === "new" ? model.basePrice : model.usedBasePrice
      const depreciationRate = model.depreciationRate

      setInputs((prev) => ({
        ...prev,
        P_buy: price,
        r: inputs.purchase_mode === "used" ? 0.1 : depreciationRate,
        model_depreciation: inputs.purchase_mode === "used" ? "exponential" : "tiered",
        fee_pct: 0.03,
        cost_ship: 200,
        use_tradein: false,
      }))
      setSelectedModel(modelName)
      setIsProModel(false)
    }
  }

  const applyAndroidModel = (modelName: string, isPro = false) => {
    const model = androidModels.find((m) => m.name === modelName)
    if (model) {
      const price =
        inputs.purchase_mode === "new"
          ? isPro && model.proPrice
            ? model.proPrice
            : model.basePrice
          : isPro && model.usedProPrice
            ? model.usedProPrice
            : model.usedBasePrice
      const depreciationRate = isPro ? model.depreciationRate + model.proAdjustment : model.depreciationRate

      setInputs((prev) => ({
        ...prev,
        P_buy: price,
        r: inputs.purchase_mode === "used" ? 0.1 : depreciationRate,
        model_depreciation: inputs.purchase_mode === "used" ? "exponential" : "exponential",
        fee_pct: 0.075,
        cost_ship: 0,
        use_tradein: false,
      }))
    }
  }

  const applyDepreciationPreset = (rate: number) => {
    setInputs((prev) => ({ ...prev, r: rate }))
  }

  // Get currency info based on locale
  const getCurrencyInfo = () => {
    return CURRENCY_RATES[locale as keyof typeof CURRENCY_RATES] || CURRENCY_RATES["zh-TW"]
  }

  // Convert TWD amount to current locale currency
  const convertCurrency = (twdAmount: number) => {
    const { rate } = getCurrencyInfo()
    return Math.round(twdAmount * rate)
  }

  // Convert current locale currency back to TWD
  const convertToTWD = (localAmount: number) => {
    const { rate } = getCurrencyInfo()
    return Math.round(localAmount / rate)
  }

  const formatCurrency = (amount: number) => {
    const { currency, symbol } = getCurrencyInfo()
    const convertedAmount = convertCurrency(amount)

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(convertedAmount)
  }

  // Add midrange Android model with translation
  const midrangeAndroidModel: AndroidModel = {
    name: t("phoneModels.midrangeAndroid"),
    basePrice: 15000,
    depreciationRate: 0.5,
    proAdjustment: 0,
    usedBasePrice: 6000,
    category: "mid",
  }

  const allAndroidModels = [...androidModels, midrangeAndroidModel]

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex justify-between items-center relative">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">{t("header.title")}</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("header.description")}</p>
          </div>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t("phoneType.title")}
              </CardTitle>
              <CardDescription>{t("phoneType.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant={phoneType === "iphone" ? "default" : "outline"}
                  onClick={() => setPhoneType("iphone")}
                  className="h-auto p-4 flex-col items-start"
                >
                  <div className="font-medium">{t("phoneType.iphone")}</div>
                  <div
                    className={`text-sm ${phoneType === "iphone" ? "text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {t("phoneType.iphoneDesc")}
                  </div>
                </Button>
                <Button
                  variant={phoneType === "android" ? "default" : "outline"}
                  onClick={() => setPhoneType("android")}
                  className="h-auto p-4 flex-col items-start"
                >
                  <div className="font-medium">{t("phoneType.android")}</div>
                  <div
                    className={`text-sm ${phoneType === "android" ? "text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {t("phoneType.androidDesc")}
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t("purchaseMode.title")}
              </CardTitle>
              <CardDescription>{t("purchaseMode.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant={inputs.purchase_mode === "new" ? "default" : "outline"}
                  onClick={() => handlePurchaseModeChange("new")}
                  className="h-auto p-4 flex-col items-start"
                >
                  <div className="font-medium">{t("purchaseMode.new")}</div>
                  <div
                    className={`text-sm ${inputs.purchase_mode === "new" ? "text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {t("purchaseMode.newDesc")}
                  </div>
                </Button>
                <Button
                  variant={inputs.purchase_mode === "used" ? "default" : "outline"}
                  onClick={() => handlePurchaseModeChange("used")}
                  className="h-auto p-4 flex-col items-start"
                >
                  <div className="font-medium">{t("purchaseMode.used")}</div>
                  <div
                    className={`text-sm ${inputs.purchase_mode === "used" ? "text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {t("purchaseMode.usedDesc")}
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {t("phoneModel.title", {
                  type: phoneType === "iphone" ? " iPhone" : " Android",
                })}
              </CardTitle>
              <CardDescription>
                {t("phoneModel.description", {
                  type: phoneType === "iphone" ? " iPhone" : " Android",
                  mode: inputs.purchase_mode === "new" ? t("phoneModel.official") : t("phoneModel.secondhand"),
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {phoneType === "iphone" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {iPhoneModels.map((model) => (
                    <Button
                      key={model.name}
                      variant={selectedModel === model.name ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => {
                        setSelectedModel(model.name)
                        if (purchaseMode === "new") {
                          setInputs((prev) => ({ ...prev, P_buy: isProModel ? model.proPrice : model.basePrice }))
                          setInputs((prev) => ({ ...prev, model_depreciation: "tiered" }))
                        } else {
                          setInputs((prev) => ({
                            ...prev,
                            P_buy: isProModel ? model.usedProPrice : model.usedBasePrice,
                          }))
                        }
                        setInputs((prev) => ({
                          ...prev,
                          r: model.depreciationRate + (isProModel ? model.proAdjustment : 0),
                        }))
                      }}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {purchaseMode === "new"
                          ? formatCurrency(model.basePrice)
                          : formatCurrency(model.usedBasePrice)}
                      </div>
                    </Button>
                  ))}

                  {iPhoneAirModels.map((model) => (
                    <Button
                      key={model.name}
                      variant={selectedModel === model.name ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => {
                        setSelectedModel(model.name)
                        if (purchaseMode === "new") {
                          setInputs((prev) => ({ ...prev, P_buy: model.basePrice }))
                          setInputs((prev) => ({ ...prev, model_depreciation: "tiered" }))
                        } else {
                          setInputs((prev) => ({ ...prev, P_buy: model.usedBasePrice }))
                        }
                        setInputs((prev) => ({ ...prev, r: model.depreciationRate }))
                      }}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {purchaseMode === "new"
                          ? formatCurrency(model.basePrice)
                          : formatCurrency(model.usedBasePrice)}
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-4 gap-3">
                  {allAndroidModels.map((model) => (
                    <div key={model.name} className="space-y-2">
                      <div className="text-sm font-medium text-center">{model.name}</div>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyAndroidModel(model.name, false)}
                          className="text-xs h-8"
                        >
                          {model.category === "mid" || model.category === "budget"
                            ? t("common.standard")
                            : t("common.standard")}
                          <div className="text-xs text-muted-foreground ml-1">
                            {formatCurrency(inputs.purchase_mode === "new" ? model.basePrice : model.usedBasePrice)}
                          </div>
                        </Button>
                        {model.proPrice && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyAndroidModel(model.name, true)}
                            className="text-xs h-8"
                          >
                            {t("common.pro")}
                            <div className="text-xs text-muted-foreground ml-1">
                              {formatCurrency(inputs.purchase_mode === "new" ? model.proPrice : model.usedProPrice!)}
                            </div>
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-center text-muted-foreground">
                        {t("common.annualDepreciation")} {(model.depreciationRate * 100).toFixed(1)}%
                        <div className="text-xs">
                          (
                          {model.category === "flagship"
                            ? t("common.flagship")
                            : model.category === "mid"
                              ? t("common.midrange")
                              : t("common.budget")}
                          )
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {phoneType === "android" && (
                <div className="mt-4 text-xs text-muted-foreground bg-muted p-3 rounded">
                  <div className="font-medium mb-1">{t("phoneModel.androidDepreciationInfo.title")}</div>
                  <div>{t("phoneModel.androidDepreciationInfo.flagship")}</div>
                  <div>{t("phoneModel.androidDepreciationInfo.midrange")}</div>
                  <div>{t("phoneModel.androidDepreciationInfo.used")}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {t("calculator.title")}
                </CardTitle>
                <CardDescription>{t("calculator.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">{t("calculator.basicInfo")}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="P_buy">
                        {inputs.purchase_mode === "new"
                          ? t("calculator.purchasePrice")
                          : t("calculator.usedPurchasePrice")}{" "}
                        ({t("common.currency")})
                      </Label>
                      <Input
                        id="P_buy"
                        type="number"
                        value={convertCurrency(inputs.P_buy)}
                        onChange={(e) => handleInputChange("P_buy", convertToTWD(Number(e.target.value)))}
                        className="bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="T">{t("calculator.holdingYears")}</Label>
                      <Input
                        id="T"
                        type="number"
                        step="0.5"
                        value={inputs.T}
                        onChange={(e) => handleInputChange("T", Number(e.target.value))}
                        className="bg-input"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">{t("calculator.depreciationModel")}</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t("calculator.depreciationMethod")}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange("model_depreciation", "tiered")}
                          className="text-xs"
                        >
                          {t("calculator.tieredDepreciation")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange("model_depreciation", "exponential")}
                          className="text-xs"
                        >
                          {t("calculator.exponentialDepreciation")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange("model_depreciation", "linear")}
                          className="text-xs"
                        >
                          {t("calculator.linearDepreciation")}
                        </Button>
                      </div>
                      {inputs.model_depreciation === "tiered" && (
                        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                          <div className="font-medium mb-1">{t("calculator.tieredDepreciationInfo.title")}</div>
                          <div>{t("calculator.tieredDepreciationInfo.year1")}</div>
                          <div>{t("calculator.tieredDepreciationInfo.year2")}</div>
                          <div>{t("calculator.tieredDepreciationInfo.year3")}</div>
                        </div>
                      )}
                    </div>

                    {inputs.model_depreciation === "exponential" ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="r">{t("calculator.annualDepreciationRate")}</Label>
                          <Input
                            id="r"
                            type="number"
                            step="0.01"
                            value={inputs.r * 100}
                            onChange={(e) => handleInputChange("r", Number(e.target.value) / 100)}
                            className="bg-input"
                          />
                        </div>
                        {inputs.purchase_mode === "used" && (
                          <div className="space-y-2">
                            <Label>{t("calculator.quickSetDepreciationRate")}</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyDepreciationPreset(0.12)}
                                className="text-xs"
                              >
                                {t("calculator.optimistic")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyDepreciationPreset(0.15)}
                                className="text-xs"
                              >
                                {t("calculator.baseline")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyDepreciationPreset(0.2)}
                                className="text-xs"
                              >
                                {t("calculator.conservative")}
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">{t("calculator.depreciationNote")}</div>
                          </div>
                        )}
                      </div>
                    ) : inputs.model_depreciation === "linear" ? (
                      <div className="space-y-2">
                        <Label htmlFor="linear_d">
                          {t("calculator.annualDepreciationAmount")}
                        </Label>
                        <Input
                          id="linear_d"
                          type="number"
                          value={convertCurrency(inputs.linear_d)}
                          onChange={(e) => handleInputChange("linear_d", convertToTWD(Number(e.target.value)))}
                          className="bg-input"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">{t("calculator.resaleCost")}</h3>
                  <div className="space-y-3">
                    <Label>{t("calculator.quickSetPlatformFee")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleInputChange("fee_pct", 0.03)
                          handleInputChange("cost_ship", 200)
                        }}
                        className="text-xs h-auto p-2 flex-col"
                      >
                        <div className="font-medium">{t("calculator.ruten")}</div>
                        <div className="text-xs text-muted-foreground">{t("calculator.rutenDesc")}</div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleInputChange("fee_pct", 0.075)
                          handleInputChange("cost_ship", 0)
                        }}
                        className="text-xs h-auto p-2 flex-col"
                      >
                        <div className="font-medium">{t("calculator.shopee")}</div>
                        <div className="text-xs text-muted-foreground">{t("calculator.shopeeDesc")}</div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleInputChange("fee_pct", 0.095)
                          handleInputChange("cost_ship", 0)
                        }}
                        className="text-xs h-auto p-2 flex-col"
                      >
                        <div className="font-medium">{t("calculator.shopeePromo")}</div>
                        <div className="text-xs text-muted-foreground">{t("calculator.shopeePromoDesc")}</div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleInputChange("fee_pct", 0.05)
                          handleInputChange("cost_ship", 150)
                        }}
                        className="text-xs h-auto p-2 flex-col"
                      >
                        <div className="font-medium">{t("calculator.otherPlatform")}</div>
                        <div className="text-xs text-muted-foreground">{t("calculator.otherPlatformDesc")}</div>
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                      <div className="font-medium mb-1">{t("calculator.shopeeFeeInfo.title")}</div>
                      <div>{t("calculator.shopeeFeeInfo.normal")}</div>
                      <div>{t("calculator.shopeeFeeInfo.promo")}</div>
                      <div>{t("calculator.shopeeFeeInfo.cap")}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fee_pct">{t("calculator.platformFee")}</Label>
                      <Input
                        id="fee_pct"
                        type="number"
                        step="0.01"
                        value={inputs.fee_pct * 100}
                        onChange={(e) => handleInputChange("fee_pct", Number(e.target.value) / 100)}
                        className="bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost_ship">
                        {t("calculator.shippingFee")}
                      </Label>
                      <Input
                        id="cost_ship"
                        type="number"
                        value={convertCurrency(inputs.cost_ship)}
                        onChange={(e) => handleInputChange("cost_ship", convertToTWD(Number(e.target.value)))}
                        className="bg-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="use_tradein"
                        checked={inputs.use_tradein}
                        onChange={(e) => handleInputChange("use_tradein", e.target.checked)}
                        className="rounded border-border"
                      />
                      <Label htmlFor="use_tradein">
                        {t("calculator.useTradeIn")}
                        <span className="text-xs text-muted-foreground ml-1">{t("calculator.tradeInNote")}</span>
                      </Label>
                    </div>

                    {inputs.use_tradein && (
                      <div className="space-y-2">
                        <Label htmlFor="alpha_tradein">{t("calculator.tradeInRatio")}</Label>
                        <Input
                          id="alpha_tradein"
                          type="number"
                          step="0.01"
                          value={inputs.alpha_tradein * 100}
                          onChange={(e) => handleInputChange("alpha_tradein", Number(e.target.value) / 100)}
                          className="bg-input"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">{t("calculator.maintenanceCost")}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="C_maint_yearly">{t("calculator.annualMaintenanceFee")}</Label>
                      <Input
                        id="C_maint_yearly"
                        type="number"
                        value={convertCurrency(inputs.C_maint_yearly)}
                        onChange={(e) => handleInputChange("C_maint_yearly", convertToTWD(Number(e.target.value)))}
                        className="bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="C_battery_oneoff">
                        {t("calculator.batteryReplacementFee")}
                        <span className="text-xs text-muted-foreground ml-1">
                          {t("calculator.batteryReplacementNote")}
                        </span>
                      </Label>
                      <Input
                        id="C_battery_oneoff"
                        type="number"
                        value={convertCurrency(inputs.C_battery_oneoff)}
                        onChange={(e) => handleInputChange("C_battery_oneoff", convertToTWD(Number(e.target.value)))}
                        className="bg-input"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  {t("results.title")}
                </CardTitle>
                <CardDescription>{t("results.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">{t("results.totalOwnershipCost")}</div>
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(results?.totalCost || 0)}
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">{t("results.monthlyAverageCost")}</div>
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(results?.monthlyCost || 0)}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">{t("results.detailedAnalysis")}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {t("results.estimatedPriceAfterYears", { years: inputs.T })}
                        </span>
                        <span className="font-medium text-foreground">{formatCurrency(results?.priceAtT || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t("results.netResaleAmount")}</span>
                        <span className="font-medium text-foreground">{formatCurrency(results?.resaleNet || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t("results.annualOwnershipCost")}</span>
                        <span className="font-medium text-foreground">{formatCurrency(results?.annualCost || 0)}</span>
                      </div>
                      {results?.npvTotalCost && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{t("results.discountedTotalCost")}</span>
                          <span className="font-medium text-foreground">{formatCurrency(results.npvTotalCost)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-3">{t("results.costBreakdown")}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t("results.purchaseCost")}</span>
                        <span className="text-foreground">{formatCurrency(inputs.P_buy)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t("results.resaleValue")}</span>
                        <span className="text-green-700 dark:text-green-400">
                          -{formatCurrency(results?.resaleNet || 0)}
                        </span>
                      </div>
                      {inputs.C_maint_yearly > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>{t("results.maintenanceFee")}</span>
                          <span className="text-foreground">{formatCurrency(inputs.C_maint_yearly * inputs.T)}</span>
                        </div>
                      )}
                      {inputs.C_battery_oneoff > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>{t("results.batteryReplacement")}</span>
                          <span className="text-foreground">{formatCurrency(inputs.C_battery_oneoff)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>{t("presets.title")}</CardTitle>
              <CardDescription>{t("presets.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {phoneType === "iphone" ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 35000,
                          T: 1,
                          r: 0.4,
                          fee_pct: 0.03,
                          cost_ship: 200,
                          C_maint_yearly: 0,
                          C_battery_oneoff: 0,
                          use_tradein: false,
                        })
                      }}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">{t("presets.iphoneYearly.title")}</div>
                      <div className="text-sm text-muted-foreground">{t("presets.iphoneYearly.description")}</div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 25000,
                          T: 3,
                          r: 0.15,
                          fee_pct: 0.03,
                          cost_ship: 200,
                          C_maint_yearly: 1000,
                          C_battery_oneoff: 2500,
                          use_tradein: false,
                        })
                      }}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">{t("presets.iphoneLongTerm.title")}</div>
                      <div className="text-sm text-muted-foreground">{t("presets.iphoneLongTerm.description")}</div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 30000,
                          T: 2,
                          r: 0.2,
                          fee_pct: 0.05,
                          cost_ship: 200,
                          C_maint_yearly: 0,
                          C_battery_oneoff: 0,
                          use_tradein: false,
                        })
                      }}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">{t("presets.iphoneSecondhand.title")}</div>
                      <div className="text-sm text-muted-foreground">{t("presets.iphoneSecondhand.description")}</div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 15000,
                          T: 2,
                          r: 0.2,
                          fee_pct: 0.03,
                          cost_ship: 150,
                          use_tradein: true,
                          alpha_tradein: 0.6,
                        })
                      }}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">{t("presets.iphoneTradeIn.title")}</div>
                      <div className="text-sm text-muted-foreground">{t("presets.iphoneTradeIn.description")}</div>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 13000,
                          T: 3,
                          r: 0.15,
                          fee_pct: 0.03,
                          cost_ship: 200,
                          C_maint_yearly: 0,
                          C_battery_oneoff: 2500,
                          use_tradein: false,
                        })
                      }}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">{t("presets.androidUsedLongTerm.title")}</div>
                      <div className="text-sm text-muted-foreground">
                        {t("presets.androidUsedLongTerm.description")}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 10000,
                          T: 2,
                          r: 0.12,
                          fee_pct: 0.03,
                          cost_ship: 200,
                          C_maint_yearly: 0,
                          C_battery_oneoff: 0,
                          use_tradein: false,
                        })
                      }}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">{t("presets.androidOptimistic.title")}</div>
                      <div className="text-sm text-muted-foreground">{t("presets.androidOptimistic.description")}</div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 18000,
                          T: 1.5,
                          r: 0.2,
                          fee_pct: 0.03,
                          cost_ship: 0,
                          C_maint_yearly: 500,
                          C_battery_oneoff: 0,
                          use_tradein: false,
                        })
                      }}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">{t("presets.androidConservative.title")}</div>
                      <div className="text-sm text-muted-foreground">
                        {t("presets.androidConservative.description")}
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 14500,
                          T: 2,
                          r: 0.15,
                          fee_pct: 0,
                          cost_ship: 0,
                          C_maint_yearly: 0,
                          C_battery_oneoff: 2500,
                          use_tradein: true,
                          alpha_tradein: 0.5,
                        })
                      }}
                      className="h-auto p-4 flex-col items-start"
                    >
                      <div className="font-medium">{t("presets.androidTradeIn.title")}</div>
                      <div className="text-sm text-muted-foreground">{t("presets.androidTradeIn.description")}</div>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{t("footer.openSource")}</span>
              <a
                href="https://github.com/Yukaii/deprecalc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>{t("footer.github")}</span>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">{t("footer.projectName")}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}