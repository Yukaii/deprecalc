"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Calculator, Smartphone, TrendingDown, ShoppingCart } from "lucide-react"

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
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Smartphone className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">手機持有成本計算器</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            計算您的 iPhone 或 Android 手機在持有期間的真實成本，包含折舊、手續費、維護費用等各項支出
          </p>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              手機類型選擇
            </CardTitle>
            <CardDescription>選擇您要計算的手機類型</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                variant={phoneType === "iphone" ? "default" : "outline"}
                onClick={() => setPhoneType("iphone")}
                className="h-auto p-4 flex-col items-start"
              >
                <div className="font-medium">iPhone</div>
                <div
                  className={`text-sm ${phoneType === "iphone" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                >
                  Apple iPhone 系列手機
                </div>
              </Button>
              <Button
                variant={phoneType === "android" ? "default" : "outline"}
                onClick={() => setPhoneType("android")}
                className="h-auto p-4 flex-col items-start"
              >
                <div className="font-medium">Android</div>
                <div
                  className={`text-sm ${phoneType === "android" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                >
                  Samsung、Google Pixel、OnePlus 等
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              購買方式選擇
            </CardTitle>
            <CardDescription>選擇您要計算全新機或二手機的持有成本</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                variant={inputs.purchase_mode === "new" ? "default" : "outline"}
                onClick={() => handlePurchaseModeChange("new")}
                className="h-auto p-4 flex-col items-start"
              >
                <div className="font-medium">購買全新機</div>
                <div
                  className={`text-sm ${inputs.purchase_mode === "new" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                >
                  從官方或授權經銷商購買全新手機
                </div>
              </Button>
              <Button
                variant={inputs.purchase_mode === "used" ? "default" : "outline"}
                onClick={() => handlePurchaseModeChange("used")}
                className="h-auto p-4 flex-col items-start"
              >
                <div className="font-medium">購買二手機</div>
                <div
                  className={`text-sm ${inputs.purchase_mode === "used" ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                >
                  從二手市場購買使用過的手機
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              常用{phoneType === "iphone" ? " iPhone" : " Android"} 機型
            </CardTitle>
            <CardDescription>
              選擇您的{phoneType === "iphone" ? " iPhone" : " Android"}機型，自動套用對應的
              {inputs.purchase_mode === "new" ? "官方" : "二手市場"}價格和折舊率
            </CardDescription>
          </CardHeader>
          <CardContent>
            {phoneType === "iphone" ? (
              <div className="grid md:grid-cols-5 gap-3">
                {iPhoneModels.map((model) => (
                  <div key={model.name} className="space-y-2">
                    <div className="text-sm font-medium text-center">{model.name}</div>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyiPhoneModel(model.name, false)}
                        className="text-xs h-8"
                      >
                        標準版
                        <div className="text-xs text-muted-foreground ml-1">
                          {formatCurrency(inputs.purchase_mode === "new" ? model.basePrice : model.usedBasePrice)}
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyiPhoneModel(model.name, true)}
                        className="text-xs h-8"
                      >
                        Pro 版
                        <div className="text-xs text-muted-foreground ml-1">
                          {formatCurrency(inputs.purchase_mode === "new" ? model.proPrice : model.usedProPrice)}
                        </div>
                      </Button>
                    </div>
                    <div className="text-xs text-center text-muted-foreground">
                      年折舊 {(model.depreciationRate * 100).toFixed(1)}%
                      {model.name === "iPhone 16" && <div className="text-xs">(預估值)</div>}
                    </div>
                  </div>
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
                        {model.category === "mid" || model.category === "budget" ? "標準版" : "標準版"}
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
                          Pro/Ultra
                          <div className="text-xs text-muted-foreground ml-1">
                            {formatCurrency(inputs.purchase_mode === "new" ? model.proPrice : model.usedProPrice!)}
                          </div>
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-center text-muted-foreground">
                      年折舊 {(model.depreciationRate * 100).toFixed(1)}%
                      <div className="text-xs">
                        ({model.category === "flagship" ? "旗艦" : model.category === "mid" ? "中階" : "平價"})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {phoneType === "android" && (
              <div className="mt-4 text-xs text-muted-foreground bg-muted p-3 rounded">
                <div className="font-medium mb-1">Android 折舊率說明：</div>
                <div>• 旗艦機 (Galaxy S/Pixel): 50-65% 年折舊率，Pro 版通常保值 5% 更好</div>
                <div>• 中階機: 約 50% 年折舊率，價格親民但保值性較低</div>
                <div>• 二手 Android 建議使用 10% 恆定折舊率（已過初期貶值期）</div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                計算參數設定
              </CardTitle>
              <CardDescription>請輸入您的手機購買和使用相關資訊</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">基本資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="P_buy">{inputs.purchase_mode === "new" ? "購買價格" : "二手購入價格"} (NT$)</Label>
                    <Input
                      id="P_buy"
                      type="number"
                      value={inputs.P_buy}
                      onChange={(e) => handleInputChange("P_buy", Number(e.target.value))}
                      className="bg-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="T">持有年數</Label>
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
                <h3 className="font-semibold text-foreground">折舊模型</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>折舊計算方式</Label>
                    <Select
                      value={inputs.model_depreciation}
                      onValueChange={(value: "exponential" | "linear" | "tiered") =>
                        handleInputChange("model_depreciation", value)
                      }
                    >
                      <SelectTrigger className="bg-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiered">階段式折舊 (推薦)</SelectItem>
                        <SelectItem value="exponential">指數折舊</SelectItem>
                        <SelectItem value="linear">線性折舊</SelectItem>
                      </SelectContent>
                    </Select>
                    {inputs.model_depreciation === "tiered" && (
                      <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                        <div className="font-medium mb-1">階段式折舊說明：</div>
                        <div>• 第1年：45% 折舊（新機貶值最快）</div>
                        <div>• 第2年：25% 折舊（趨於穩定）</div>
                        <div>• 第3年後：每年10% 折舊（穩定期）</div>
                      </div>
                    )}
                  </div>

                  {inputs.model_depreciation === "exponential" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="r">年折舊率 (%)</Label>
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
                          <Label>快速設定折舊率</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => applyDepreciationPreset(0.12)}
                              className="text-xs"
                            >
                              樂觀 12%
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => applyDepreciationPreset(0.15)}
                              className="text-xs"
                            >
                              基準 15%
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => applyDepreciationPreset(0.2)}
                              className="text-xs"
                            >
                              保守 20%
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">* 可參考相鄰世代二手價差異進行校正</div>
                        </div>
                      )}
                    </div>
                  ) : inputs.model_depreciation === "linear" ? (
                    <div className="space-y-2">
                      <Label htmlFor="linear_d">每年折舊金額 (NT$)</Label>
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
                <h3 className="font-semibold text-foreground">賣出成本</h3>
                <div className="space-y-3">
                  <Label>快速設定平台手續費</Label>
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
                      <div className="font-medium">露天拍賣</div>
                      <div className="text-xs text-muted-foreground">3% + 運費</div>
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
                      <div className="font-medium">蝦皮購物</div>
                      <div className="text-xs text-muted-foreground">7.5% (非促銷)</div>
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
                      <div className="font-medium">蝦皮促銷期</div>
                      <div className="text-xs text-muted-foreground">9.5% (7.5%+2%)</div>
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
                      <div className="font-medium">其他平台</div>
                      <div className="text-xs text-muted-foreground">5% + 運費</div>
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                    <div className="font-medium mb-1">蝦皮手續費說明：</div>
                    <div>• 非促銷期：成交手續費 5.5% + 金流服務費 2% = 7.5%</div>
                    <div>• 促銷檔期：成交手續費 7.5% + 金流服務費 2% = 9.5%</div>
                    <div>• 部分商品有 NT$15,000 手續費計算上限</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fee_pct">平台手續費 (%)</Label>
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
                    <Label htmlFor="cost_ship">運費/包材 (NT$)</Label>
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
                      使用門市 Trade-in 回收
                      <span className="text-xs text-muted-foreground ml-1">(如US3C、Landtop等)</span>
                    </Label>
                  </div>

                  {inputs.use_tradein && (
                    <div className="space-y-2">
                      <Label htmlFor="alpha_tradein">Trade-in 回收比例 (%)</Label>
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
                <h3 className="font-semibold text-foreground">維護成本</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="C_maint_yearly">年維護費 (NT$)</Label>
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
                      電池維修費 (NT$)
                      <span className="text-xs text-muted-foreground ml-1">(約2,000-3,350元)</span>
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
                計算結果
              </CardTitle>
              <CardDescription>您的手機持有成本分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">總持有成本</div>
                    <div className="text-2xl font-bold text-foreground">{formatCurrency(results?.totalCost || 0)}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">月均成本</div>
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(results?.monthlyCost || 0)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">詳細分析</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">預估 {inputs.T} 年後市價</span>
                      <span className="font-medium text-foreground">{formatCurrency(results?.priceAtT || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">賣出後實得金額</span>
                      <span className="font-medium text-foreground">{formatCurrency(results?.resaleNet || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">年均持有成本</span>
                      <span className="font-medium text-foreground">{formatCurrency(results?.annualCost || 0)}</span>
                    </div>
                    {results?.npvTotalCost && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">折現後總成本</span>
                        <span className="font-medium text-foreground">{formatCurrency(results.npvTotalCost)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-3">成本組成</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>購買成本</span>
                      <span className="text-foreground">{formatCurrency(inputs.P_buy)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>回收價值</span>
                      <span className="text-green-700 dark:text-green-400">
                        -{formatCurrency(results?.resaleNet || 0)}
                      </span>
                    </div>
                    {inputs.C_maint_yearly > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>維護費用</span>
                        <span className="text-foreground">{formatCurrency(inputs.C_maint_yearly * inputs.T)}</span>
                      </div>
                    )}
                    {inputs.C_battery_oneoff > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>電池維修</span>
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
            <CardTitle>快速預設情境</CardTitle>
            <CardDescription>點擊下方按鈕快速套用常見的使用情境</CardDescription>
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
                    <div className="font-medium">每年換新機</div>
                    <div className="text-sm text-muted-foreground">高折舊率，短持有期</div>
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
                    <div className="font-medium">長期使用</div>
                    <div className="text-sm text-muted-foreground">包含維護和電池更換</div>
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
                    <div className="font-medium">二手市場售出</div>
                    <div className="text-sm text-muted-foreground">透過拍賣平台賣出</div>
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
                    <div className="font-medium">Trade-in 回收</div>
                    <div className="text-sm text-muted-foreground">門市直接回收換購</div>
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
                    <div className="font-medium">二手機長期使用</div>
                    <div className="text-sm text-muted-foreground">Galaxy S23 持有3年含換電池</div>
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
                    <div className="font-medium">樂觀情境</div>
                    <div className="text-sm text-muted-foreground">Galaxy S24 低折舊率</div>
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
                    <div className="font-medium">保守情境</div>
                    <div className="text-sm text-muted-foreground">Pixel 8 高折舊率</div>
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
                    <div className="font-medium">門市回收</div>
                    <div className="text-sm text-muted-foreground">US3C/Landtop等回收</div>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
