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
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslations } from 'next-intl'

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
    usedBasePrice: 7800,
    usedProPrice: 9500,
  },
  {
    name: "iPhone 13",
    basePrice: 24900,
    proPrice: 31900,
    depreciationRate: 0.462,
    proAdjustment: -0.06,
    usedBasePrice: 10000,
    usedProPrice: 12000,
  },
  {
    name: "iPhone 14",
    basePrice: 27900,
    proPrice: 34900,
    depreciationRate: 0.477,
    proAdjustment: -0.06,
    usedBasePrice: 13000,
    usedProPrice: 15500,
  },
  {
    name: "iPhone 15",
    basePrice: 29900,
    proPrice: 36900,
    depreciationRate: 0.482,
    proAdjustment: -0.06,
    usedBasePrice: 16000,
    usedProPrice: 19000,
  },
  {
    name: "iPhone 16",
    basePrice: 30900,
    proPrice: 37900,
    depreciationRate: 0.45,
    proAdjustment: -0.06,
    usedBasePrice: 18000,
    usedProPrice: 21000,
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
    usedBasePrice: 15000,
    usedProPrice: 18000,
    category: "flagship",
  },
  {
    name: "Galaxy S23",
    basePrice: 25900,
    proPrice: 32900,
    depreciationRate: 0.6,
    proAdjustment: -0.05,
    usedBasePrice: 12000,
    usedProPrice: 15000,
    category: "flagship",
  },
  {
    name: "Pixel 8",
    basePrice: 24900,
    proPrice: 31900,
    depreciationRate: 0.55,
    proAdjustment: -0.05,
    usedBasePrice: 11000,
    usedProPrice: 14000,
    category: "flagship",
  },
  {
    name: "Pixel 7",
    basePrice: 19900,
    proPrice: 26900,
    depreciationRate: 0.55,
    proAdjustment: -0.05,
    usedBasePrice: 8500,
    usedProPrice: 11000,
    category: "flagship",
  },
  {
    name: "OnePlus 12",
    basePrice: 22900,
    depreciationRate: 0.5,
    proAdjustment: 0,
    usedBasePrice: 10000,
    category: "flagship",
  },
  {
    name: "中階 Android",
    basePrice: 15000,
    depreciationRate: 0.5,
    proAdjustment: 0,
    usedBasePrice: 6000,
    category: "mid",
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
      // First year: high depreciation (40-50%)
      yearlyRate = 0.45
    } else if (year === 2) {
      // Second year: moderate depreciation (20-30%)
      yearlyRate = 0.25
    } else {
      // Third year onwards: stable depreciation (~10%)
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
    // tiered depreciation
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

export default function PhoneCalculator() {
  const t = useTranslations()
  const headerT = useTranslations('header')
  const phoneTypeT = useTranslations('phoneType')
  const purchaseModeT = useTranslations('purchaseMode')
  const phoneModelsT = useTranslations('phoneModels')
  const calculatorT = useTranslations('calculator')
  const resultsT = useTranslations('results')
  const presetsT = useTranslations('presets')
  const footerT = useTranslations('footer')
  const commonT = useTranslations('common')
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
      // Set depreciation model to constant 10% for used phones (typically 2+ years old)
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
        fee_pct: 0.075, // Default to Shopee for Android
        cost_ship: 0,
        use_tradein: false,
      }))
    }
  }

  const applyDepreciationPreset = (rate: number) => {
    setInputs((prev) => ({ ...prev, r: rate }))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex justify-between items-center">
            <div></div>
            <div className="flex gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">{headerT('title')}</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {headerT('description')}
            </p>
          </div>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {phoneTypeT('title')}
              </CardTitle>
              <CardDescription>{phoneTypeT('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant={phoneType === "iphone" ? "default" : "outline"}
                  onClick={() => setPhoneType("iphone")}
                  className="h-auto p-4 flex-col items-start"
                >
                  <div className="font-medium">{phoneTypeT('iphone')}</div>
                  <div
                    className={`text-sm ${phoneType === "iphone" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {phoneTypeT('iphoneDesc')}
                  </div>
                </Button>
                <Button
                  variant={phoneType === "android" ? "default" : "outline"}
                  onClick={() => setPhoneType("android")}
                  className="h-auto p-4 flex-col items-start"
                >
                  <div className="font-medium">{phoneTypeT('android')}</div>
                  <div
                    className={`text-sm ${phoneType === "android" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {phoneTypeT('androidDesc')}
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {purchaseModeT('title')}
              </CardTitle>
              <CardDescription>{purchaseModeT('description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant={inputs.purchase_mode === "new" ? "default" : "outline"}
                  onClick={() => handlePurchaseModeChange("new")}
                  className="h-auto p-4 flex-col items-start"
                >
                  <div className="font-medium">{purchaseModeT('new')}</div>
                  <div
                    className={`text-sm ${inputs.purchase_mode === "new" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {purchaseModeT('newDesc')}
                  </div>
                </Button>
                <Button
                  variant={inputs.purchase_mode === "used" ? "default" : "outline"}
                  onClick={() => handlePurchaseModeChange("used")}
                  className="h-auto p-4 flex-col items-start"
                >
                  <div className="font-medium">{purchaseModeT('used')}</div>
                  <div
                    className={`text-sm ${inputs.purchase_mode === "used" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                  >
                    {purchaseModeT('usedDesc')}
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                {phoneModelsT('title', {
                  type: phoneType === "iphone" ? " iPhone" : " Android"
                })}
              </CardTitle>
              <CardDescription>
                {phoneModelsT('description', {
                  type: phoneType === "iphone" ? " iPhone" : " Android",
                  mode: inputs.purchase_mode === "new" ? phoneModelsT('official') : phoneModelsT('secondHand')
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
                          ? `NT$ ${model.basePrice.toLocaleString()}`
                          : `NT$ ${model.usedBasePrice.toLocaleString()}`}
                      </div>
                    </Button>
                  ))}

                  {/* iPhone Air section */}
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
                          ? `NT$ ${model.basePrice.toLocaleString()}`
                          : `NT$ ${model.usedBasePrice.toLocaleString()}`}
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-4 gap-3">
                  {androidModels.map((model) => (
                    <div key={model.name} className="space-y-2">
                      <div className="text-sm font-medium text-center">{model.name}</div>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyAndroidModel(model.name, false)}
                          className="text-xs h-8"
                        >
                          {model.category === "mid" || model.category === "budget" ? phoneModelsT('standard') : phoneModelsT('standard')}
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
                            {phoneModelsT('pro')}
                            <div className="text-xs text-muted-foreground ml-1">
                              {formatCurrency(inputs.purchase_mode === "new" ? model.proPrice : model.usedProPrice!)}
                            </div>
                          </Button>
                        )}
                      </div>
                        <div className="text-xs text-center text-muted-foreground">
                          {phoneModelsT('yearlyDepreciation')} {(model.depreciationRate * 100).toFixed(1)}%
                          <div className="text-xs">
                            ({model.category === "flagship" ? phoneModelsT('flagship') : model.category === "mid" ? phoneModelsT('mid') : phoneModelsT('budget')})
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              )}
              {phoneType === "android" && (
                <div className="mt-4 text-xs text-muted-foreground bg-muted p-3 rounded">
                  <div className="font-medium mb-1">{phoneModelsT('androidDepreciationNote.title')}</div>
                  <div>{phoneModelsT('androidDepreciationNote.flagship')}</div>
                  <div>{phoneModelsT('androidDepreciationNote.mid')}</div>
                  <div>{phoneModelsT('androidDepreciationNote.used')}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {calculatorT('title')}
                </CardTitle>
                <CardDescription>{calculatorT('description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">{calculatorT('basicInfo')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="P_buy">
                        {inputs.purchase_mode === "new" ? calculatorT('purchasePrice') : calculatorT('usedPrice')} (NT$)
                      </Label>
                      <Input
                        id="P_buy"
                        type="number"
                        value={inputs.P_buy}
                        onChange={(e) => handleInputChange("P_buy", Number(e.target.value))}
                        className="bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="T">{calculatorT('holdingYears')}</Label>
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
                  <h3 className="font-semibold text-foreground">{calculatorT('depreciationModel')}</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{calculatorT('depreciationMethod')}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange("model_depreciation", "tiered")}
                          className="text-xs"
                        >
                          {calculatorT('tieredDepreciation')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange("model_depreciation", "exponential")}
                          className="text-xs"
                        >
                          {calculatorT('exponentialDepreciation')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange("model_depreciation", "linear")}
                          className="text-xs"
                        >
                          {calculatorT('linearDepreciation')}
                        </Button>
                      </div>
                      {inputs.model_depreciation === "tiered" && (
                        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                          <div className="font-medium mb-1">{calculatorT('tieredNote.title')}</div>
                          <div>{calculatorT('tieredNote.year1')}</div>
                          <div>{calculatorT('tieredNote.year2')}</div>
                          <div>{calculatorT('tieredNote.year3')}</div>
                        </div>
                      )}
                    </div>

                    {inputs.model_depreciation === "exponential" ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="r">{calculatorT('yearlyDepreciationRate')}</Label>
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
                            <Label>{calculatorT('quickDepreciationSet')}</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyDepreciationPreset(0.12)}
                                className="text-xs"
                              >
                                {calculatorT('optimistic')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyDepreciationPreset(0.15)}
                                className="text-xs"
                              >
                                {calculatorT('baseline')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyDepreciationPreset(0.2)}
                                className="text-xs"
                              >
                                {calculatorT('conservative')}
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground">{calculatorT('calibrationNote')}</div>
                          </div>
                        )}
                      </div>
                    ) : inputs.model_depreciation === "linear" ? (
                      <div className="space-y-2">
                        <Label htmlFor="linear_d">{calculatorT('yearlyDepreciationAmount')}</Label>
                        <Input
                          id="linear_d"
                          type="number"
                          value={inputs.linear_d}
                          onChange={(e) => handleInputChange("linear_d", Number(e.target.value))}
                          className="bg-input"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">{calculatorT('sellingCost')}</h3>
                  <div className="space-y-3">
                    <Label>{calculatorT('quickPlatformFee')}</Label>
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
                        <div className="font-medium">{calculatorT('ruten')}</div>
                        <div className="text-xs text-muted-foreground">{calculatorT('rutenFee')}</div>
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
                        <div className="font-medium">{calculatorT('shopee')}</div>
                        <div className="text-xs text-muted-foreground">{calculatorT('shopeeFee')}</div>
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
                        <div className="font-medium">{calculatorT('shopeePromo')}</div>
                        <div className="text-xs text-muted-foreground">{calculatorT('shopeePromoFee')}</div>
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
                        <div className="font-medium">{calculatorT('otherPlatform')}</div>
                        <div className="text-xs text-muted-foreground">{calculatorT('otherPlatformFee')}</div>
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                      <div className="font-medium mb-1">{calculatorT('shopeeFeeNote.title')}</div>
                      <div>{calculatorT('shopeeFeeNote.normal')}</div>
                      <div>{calculatorT('shopeeFeeNote.promo')}</div>
                      <div>{calculatorT('shopeeFeeNote.limit')}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fee_pct">{calculatorT('platformFee')}</Label>
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
                      <Label htmlFor="cost_ship">{calculatorT('shippingCost')}</Label>
                      <Input
                        id="cost_ship"
                        type="number"
                        value={inputs.cost_ship}
                        onChange={(e) => handleInputChange("cost_ship", Number(e.target.value))}
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
                        {calculatorT('tradeInRecycle')}
                        <span className="text-xs text-muted-foreground ml-1">{calculatorT('tradeInNote')}</span>
                      </Label>
                    </div>

                    {inputs.use_tradein && (
                      <div className="space-y-2">
                        <Label htmlFor="alpha_tradein">{calculatorT('tradeInRatio')}</Label>
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
                  <h3 className="font-semibold text-foreground">{calculatorT('maintenanceCost')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="C_maint_yearly">{calculatorT('yearlyMaintenance')}</Label>
                      <Input
                        id="C_maint_yearly"
                        type="number"
                        value={inputs.C_maint_yearly}
                        onChange={(e) => handleInputChange("C_maint_yearly", Number(e.target.value))}
                        className="bg-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="C_battery_oneoff">
                        {calculatorT('batteryReplacement')}
                        <span className="text-xs text-muted-foreground ml-1">{calculatorT('batteryNote')}</span>
                      </Label>
                      <Input
                        id="C_battery_oneoff"
                        type="number"
                        value={inputs.C_battery_oneoff}
                        onChange={(e) => handleInputChange("C_battery_oneoff", Number(e.target.value))}
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
                  {resultsT('title')}
                </CardTitle>
                <CardDescription>{resultsT('description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">{resultsT('totalCost')}</div>
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(results?.totalCost || 0)}
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">{resultsT('monthlyCost')}</div>
                      <div className="text-2xl font-bold text-foreground">
                        {formatCurrency(results?.monthlyCost || 0)}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">{resultsT('detailedAnalysis')}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{resultsT('estimatedPrice', { years: inputs.T })}</span>
                        <span className="font-medium text-foreground">{formatCurrency(results?.priceAtT || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{resultsT('netResale')}</span>
                        <span className="font-medium text-foreground">{formatCurrency(results?.resaleNet || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{resultsT('annualCost')}</span>
                        <span className="font-medium text-foreground">{formatCurrency(results?.annualCost || 0)}</span>
                      </div>
                      {results?.npvTotalCost && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{resultsT('npvTotalCost')}</span>
                          <span className="font-medium text-foreground">{formatCurrency(results.npvTotalCost)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-3">{resultsT('costBreakdown')}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{resultsT('purchaseCost')}</span>
                        <span className="text-foreground">{formatCurrency(inputs.P_buy)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{resultsT('resaleValue')}</span>
                        <span className="text-green-700 dark:text-green-400">
                          -{formatCurrency(results?.resaleNet || 0)}
                        </span>
                      </div>
                      {inputs.C_maint_yearly > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>{resultsT('maintenanceFee')}</span>
                          <span className="text-foreground">{formatCurrency(inputs.C_maint_yearly * inputs.T)}</span>
                        </div>
                      )}
                      {inputs.C_battery_oneoff > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>{resultsT('batteryRepair')}</span>
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
              <CardTitle>{presetsT('title')}</CardTitle>
              <CardDescription>{presetsT('description')}</CardDescription>
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
                      <div className="font-medium">{presetsT('yearlyUpgrade')}</div>
                      <div className="text-sm text-muted-foreground">{presetsT('yearlyUpgradeDesc')}</div>
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
                      <div className="font-medium">{presetsT('longTerm')}</div>
                      <div className="text-sm text-muted-foreground">{presetsT('longTermDesc')}</div>
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
                      <div className="font-medium">{presetsT('secondHandMarket')}</div>
                      <div className="text-sm text-muted-foreground">{presetsT('secondHandMarketDesc')}</div>
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
                      <div className="font-medium">{presetsT('tradeInRecycle')}</div>
                      <div className="text-sm text-muted-foreground">{presetsT('tradeInRecycleDesc')}</div>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 10000,
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
                      <div className="font-medium">{presetsT('usedLongTerm')}</div>
                      <div className="text-sm text-muted-foreground">{presetsT('usedLongTermDesc')}</div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 7800,
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
                      <div className="font-medium">{presetsT('optimisticScenario')}</div>
                      <div className="text-sm text-muted-foreground">{presetsT('optimisticScenarioDesc')}</div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 16000,
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
                      <div className="font-medium">{presetsT('conservativeScenario')}</div>
                      <div className="text-sm text-muted-foreground">{presetsT('conservativeScenarioDesc')}</div>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setInputs({
                          ...inputs,
                          P_buy: 12000,
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
                      <div className="font-medium">{presetsT('storeRecycle')}</div>
                      <div className="text-sm text-muted-foreground">{presetsT('storeRecycleDesc')}</div>
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
              <span>{commonT('openSource')}</span>
              <a
                href="https://github.com/Yukaii/deprecalc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>{commonT('github')}</span>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">{footerT('projectName')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
