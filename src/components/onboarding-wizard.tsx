"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { ImageUpload } from "@/components/image-upload";
import { 
  Store, 
  FileText, 
  Palette, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Eye,
  Smartphone,
  Monitor
} from "lucide-react";

const dict = {
  en: {
    title: "Welcome to MyShop",
    subtitle: "Let's set up your store in 5 simple steps",
    step: "Step",
    of: "of",
    next: "Next",
    previous: "Previous",
    complete: "Complete Setup",
    skip: "Skip for now",
    
    // Step titles
    steps: {
      store: "Store Details",
      products: "Import Products", 
      customize: "Customize Store",
      verify: "Business Verification",
      checklist: "Launch Checklist"
    },
    
    // Store Details (Step 1)
    storeName: "Store name",
    storeNamePh: "Ex: Nanda Beauty Corner",
    slug: "Store URL",
    slugPh: "Ex: nanda-beauty",
    slugHint: "This will be your store's web address: /s/your-store-name",
    businessType: "Business type",
    businessTypes: {
      retail: "Retail",
      services: "Services", 
      food: "Food & Beverages",
      fashion: "Fashion & Clothing",
      electronics: "Electronics",
      home: "Home & Garden",
      other: "Other",
    },
    description: "Store description",
    descriptionPh: "Tell customers about your store...",
    city: "City",
    cityPh: "Where is your business located?",
    country: "Country", 
    countryPh: "Mozambique",
    logo: "Store logo (optional)",
    
    // Products Import (Step 2)
    importTitle: "Add your first products",
    importSubtitle: "Import products from CSV or start with manual entry",
    csvImport: "Import from CSV",
    csvImportDesc: "Upload a CSV file with your product catalog",
    manualEntry: "Manual Entry",
    manualEntryDesc: "Add products one by one using our product manager",
    downloadTemplate: "Download CSV Template",
    uploadCsv: "Upload CSV File",
    csvFormatHint: "Format: Name, Price, Description, Category, Stock Quantity",
    
    // Customization (Step 3) 
    customizeTitle: "Customize your store",
    customizeSubtitle: "Make your store look unique and professional",
    themeColor: "Theme color",
    storeTemplate: "Store template",
    headerStyle: "Header style",
    previewStore: "Preview Store",
    
    // Verification (Step 4)
    verifyTitle: "Verify your business",
    verifySubtitle: "Build trust with customers by verifying your business",
    businessName: "Legal business name",
    businessNamePh: "As registered with authorities",
    businessReg: "Business registration number",
    businessRegPh: "Tax ID or registration number",
    ownerName: "Owner/Manager name", 
    ownerNamePh: "Your full name",
    phone: "Business phone",
    phonePh: "+258 84 123 4567",
    address: "Business address",
    addressPh: "Street address of your business",
    verifyLater: "I'll verify later",
    
    // Checklist (Step 5)
    checklistTitle: "Ready to launch!",
    checklistSubtitle: "Complete these items to get your first sale",
    tasks: {
      storeInfo: "Store information completed",
      firstProduct: "At least 1 product added", 
      storeCustomized: "Store customized",
      businessVerified: "Business verified",
      shippingSet: "Shipping methods configured",
      paymentSet: "Payment methods configured"
    },
    launchStore: "Launch Your Store",
    viewDashboard: "Go to Dashboard",
    
    errors: {
      nameRequired: "Store name is required",
      slugFormat: "Use only lowercase letters, numbers and dashes",
      slugTaken: "This store URL is already taken",
      csvUpload: "Error uploading CSV file",
      generic: "Something went wrong. Please try again.",
    },
  },
  pt: {
    title: "Bem-vindo ao MyShop",
    subtitle: "Vamos configurar a sua loja em 5 passos simples",
    step: "Passo",
    of: "de",
    next: "Próximo",
    previous: "Anterior", 
    complete: "Concluir Configuração",
    skip: "Pular por enquanto",
    
    // Step titles
    steps: {
      store: "Detalhes da Loja",
      products: "Importar Produtos",
      customize: "Personalizar Loja", 
      verify: "Verificação Empresarial",
      checklist: "Lista de Lançamento"
    },
    
    // Store Details (Step 1) 
    storeName: "Nome da loja",
    storeNamePh: "Ex: Nanda Beauty Corner",
    slug: "URL da loja",
    slugPh: "Ex: nanda-beauty",
    slugHint: "Este será o endereço web da sua loja: /s/nome-da-loja",
    businessType: "Tipo de negócio",
    businessTypes: {
      retail: "Comércio",
      services: "Serviços",
      food: "Comida e Bebidas",
      fashion: "Moda e Vestuário", 
      electronics: "Eletrónicos",
      home: "Casa e Jardim",
      other: "Outro",
    },
    description: "Descrição da loja",
    descriptionPh: "Conte aos clientes sobre a sua loja...",
    city: "Cidade",
    cityPh: "Onde está localizado o seu negócio?",
    country: "País",
    countryPh: "Moçambique", 
    logo: "Logo da loja (opcional)",
    
    // Products Import (Step 2)
    importTitle: "Adicione os seus primeiros produtos",
    importSubtitle: "Importe produtos de CSV ou comece com entrada manual",
    csvImport: "Importar de CSV",
    csvImportDesc: "Envie um ficheiro CSV com o seu catálogo de produtos",
    manualEntry: "Entrada Manual", 
    manualEntryDesc: "Adicione produtos um por um usando o nosso gestor de produtos",
    downloadTemplate: "Descarregar Modelo CSV",
    uploadCsv: "Enviar Ficheiro CSV",
    csvFormatHint: "Formato: Nome, Preço, Descrição, Categoria, Quantidade em Stock",
    
    // Customization (Step 3)
    customizeTitle: "Personalize a sua loja",
    customizeSubtitle: "Torne a sua loja única e profissional",
    themeColor: "Cor do tema",
    storeTemplate: "Modelo da loja",
    headerStyle: "Estilo do cabeçalho",
    previewStore: "Pré-visualizar Loja",
    
    // Verification (Step 4)
    verifyTitle: "Verifique o seu negócio",
    verifySubtitle: "Construa confiança com os clientes verificando o seu negócio",
    businessName: "Nome legal do negócio",
    businessNamePh: "Como registado nas autoridades",
    businessReg: "Número de registo do negócio", 
    businessRegPh: "ID fiscal ou número de registo",
    ownerName: "Nome do proprietário/gestor",
    ownerNamePh: "O seu nome completo",
    phone: "Telefone do negócio",
    phonePh: "+258 84 123 4567",
    address: "Morada do negócio",
    addressPh: "Morada da rua do seu negócio",
    verifyLater: "Vou verificar mais tarde",
    
    // Checklist (Step 5)
    checklistTitle: "Pronto para lançar!",
    checklistSubtitle: "Complete estes itens para obter a sua primeira venda",
    tasks: {
      storeInfo: "Informações da loja completadas",
      firstProduct: "Pelo menos 1 produto adicionado",
      storeCustomized: "Loja personalizada", 
      businessVerified: "Negócio verificado",
      shippingSet: "Métodos de envio configurados",
      paymentSet: "Métodos de pagamento configurados"
    },
    launchStore: "Lançar a Sua Loja",
    viewDashboard: "Ir para o Painel",
    
    errors: {
      nameRequired: "Nome da loja é obrigatório",
      slugFormat: "Use apenas letras minúsculas, números e hífen",
      slugTaken: "Este URL de loja já está em uso",
      csvUpload: "Erro ao enviar ficheiro CSV",
      generic: "Algo correu mal. Tente novamente.",
    },
  },
};

function sanitizeSlug(raw: string) {
  return raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

interface OnboardingWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function OnboardingWizard({ onComplete, onCancel }: OnboardingWizardProps) {
  const { lang } = useLanguage();
  const t = useMemo(() => dict[lang], [lang]);
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  
  // Store data across all steps
  const [storeData, setStoreData] = useState({
    // Step 1: Store Details
    name: "",
    slug: "",
    businessType: "retail", 
    description: "",
    city: "",
    country: "Mozambique",
    logoUrl: "",
    
    // Step 2: Products (will track import status)
    productsImported: false,
    importMethod: "", // "csv" or "manual"
    
    // Step 3: Customization
    themeColor: "indigo",
    storeTemplate: "classic", 
    headerStyle: "compact",
    
    // Step 4: Verification
    businessName: "",
    businessReg: "",
    ownerName: "",
    phone: "",
    address: "",
    verified: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const steps = [
    { key: "store", icon: Store, title: t.steps.store },
    { key: "products", icon: FileText, title: t.steps.products },
    { key: "customize", icon: Palette, title: t.steps.customize },
    { key: "verify", icon: ShieldCheck, title: t.steps.verify },
    { key: "checklist", icon: CheckCircle2, title: t.steps.checklist },
  ];
  
  const effectiveSlug = storeData.slug || sanitizeSlug(storeData.name);
  
  const updateStoreData = (field: string, value: string | boolean) => {
    setStoreData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };
  
  const validateStep = (stepIndex: number) => {
    const e: Record<string, string> = {};
    
    if (stepIndex === 0) {
      // Step 1: Store Details validation
      if (!storeData.name.trim()) e.name = t.errors.nameRequired;
      
      const slug = effectiveSlug;
      if (!slug) e.slug = t.errors.nameRequired;
      else if (!/^[a-z0-9-]+$/.test(slug)) e.slug = t.errors.slugFormat;
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (validateStep(currentStep)) {
        setCurrentStep(currentStep + 1);
      }
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const completeOnboarding = async () => {
    setLoading(true);
    setApiError("");
    
    try {
      // Create store with all collected data
      const res = await fetch("/api/stores/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: storeData.name.trim(),
          slug: effectiveSlug,
          businessType: storeData.businessType,
          description: storeData.description.trim(),
          city: storeData.city.trim(),
          country: storeData.country.trim(),
          logoUrl: storeData.logoUrl,
          themeColor: storeData.themeColor,
          storeTemplate: storeData.storeTemplate,
          headerTemplate: storeData.headerStyle,
          // Business verification data
          businessName: storeData.businessName,
          businessRegistration: storeData.businessReg,
          ownerName: storeData.ownerName,
          phone: storeData.phone,
          address: storeData.address,
          verified: storeData.verified,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error?.toLowerCase().includes("slug")) {
          setApiError(t.errors.slugTaken);
        } else {
          setApiError(data.error || t.errors.generic);
        }
        setLoading(false);
        return;
      }
      
      // Success!
      if (onComplete) {
        onComplete();
      } else {
        router.push("/dashboard");
      }
    } catch {
      setApiError(t.errors.generic);
      setLoading(false);
    }
  };
  
  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
          <span className="text-sm text-slate-600">
            {t.step} {currentStep + 1} {t.of} {steps.length}
          </span>
        </div>
        <p className="text-slate-600 mb-4">{t.subtitle}</p>
        
        {/* Step indicators */}
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div
                key={step.key}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${isActive ? 'border-blue-500 bg-blue-50' : 
                    isCompleted ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-white'}
                `}>
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-blue-500' :
                    isCompleted ? 'text-green-500' : 'text-slate-400'
                  }`} />
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Main content */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[500px]">
        {apiError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {apiError}
          </div>
        )}
        
        {/* Step content */}
        {currentStep === 0 && <StoreDetailsStep 
          storeData={storeData} 
          updateStoreData={updateStoreData}
          errors={errors}
          t={t}
          effectiveSlug={effectiveSlug}
        />}
        
        {currentStep === 1 && <ProductImportStep 
          storeData={storeData}
          updateStoreData={updateStoreData}
          t={t}
        />}
        
        {currentStep === 2 && <CustomizationStep
          storeData={storeData}
          updateStoreData={updateStoreData}
          t={t}
        />}
        
        {currentStep === 3 && <VerificationStep
          storeData={storeData}
          updateStoreData={updateStoreData}
          t={t}
        />}
        
        {currentStep === 4 && <ChecklistStep
          storeData={storeData}
          t={t}
        />}
        
        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={currentStep === 0 ? onCancel : prevStep}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            {currentStep === 0 ? t.skip : (
              <><ArrowLeft className="w-4 h-4 inline mr-1" />{t.previous}</>
            )}
          </button>
          
          <button
            onClick={currentStep === steps.length - 1 ? completeOnboarding : nextStep}
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {currentStep === steps.length - 1 ? t.complete : (
              <>{t.next}<ArrowRight className="w-4 h-4 inline ml-1" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Individual step components
function StoreDetailsStep({ storeData, updateStoreData, errors, t, effectiveSlug }: any) {
  const businessTypeOptions = Object.entries(t.businessTypes).map(([key, label]) => ({
    value: key,
    label: label as string,
  }));
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-4">{t.steps.store}</h2>
      
      <div className="grid gap-4">
        <Field
          label={t.storeName}
          value={storeData.name}
          placeholder={t.storeNamePh}
          error={errors.name}
          onChange={(v: string) => updateStoreData("name", v)}
          required
        />

        <div>
          <Field
            label={t.slug}
            value={storeData.slug}
            placeholder={t.slugPh}
            error={errors.slug}
            onChange={(v: string) => updateStoreData("slug", sanitizeSlug(v))}
          />
          <p className="mt-1 text-xs text-slate-500">{t.slugHint}</p>
          {effectiveSlug && !errors.slug && (
            <p className="mt-1 text-xs text-green-600">→ /s/{effectiveSlug}</p>
          )}
        </div>

        <div className="grid gap-1 text-sm">
          <label className="text-slate-700">{t.businessType}</label>
          <select
            value={storeData.businessType}
            onChange={(e) => updateStoreData("businessType", e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-blue-200 transition focus:ring"
          >
            {businessTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Field
          label={t.city}
          value={storeData.city}
          placeholder={t.cityPh}
          onChange={(v: string) => updateStoreData("city", v)}
        />

        <Field
          label={t.country}
          value={storeData.country}
          placeholder={t.countryPh}
          onChange={(v: string) => updateStoreData("country", v)}
        />

        <div>
          <label className="text-sm text-slate-700">{t.description}</label>
          <textarea
            value={storeData.description}
            placeholder={t.descriptionPh}
            onChange={(e) => updateStoreData("description", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-blue-200 transition focus:ring"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm text-slate-700">{t.logo}</label>
          <div className="mt-1">
            <ImageUpload
              currentUrl={storeData.logoUrl}
              onUrlChange={(url) => updateStoreData("logoUrl", url)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductImportStep({ storeData, updateStoreData, t }: any) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  const downloadTemplate = () => {
    const csvContent = "Name,Price,Description,Category,Stock Quantity\n" +
      "Sample Product,29.99,This is a sample product description,Electronics,10\n" +
      "Another Product,15.50,Another sample description,Fashion,5\n" +
      "T-Shirt Blue,25.00,Comfortable cotton t-shirt,Fashion,15\n" +
      "Smartphone Case,12.99,Protective phone case,Electronics,25";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  
  const handleCsvUpload = async (file: File) => {
    setUploading(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/catalog/import', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setImportResult(result);
        updateStoreData("productsImported", true);
        updateStoreData("importMethod", "csv");
        updateStoreData("importedCount", result.imported);
      } else {
        setImportResult({ error: result.error || "Failed to import CSV" });
      }
    } catch (error) {
      console.error("CSV upload error:", error);
      setImportResult({ error: "Network error during upload" });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{t.importTitle}</h2>
      <p className="text-slate-600 mb-6">{t.importSubtitle}</p>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* CSV Import Option */}
        <div className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition">
          <div className="flex items-start space-x-3">
            <Upload className="w-6 h-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">{t.csvImport}</h3>
              <p className="text-sm text-slate-600 mt-1">{t.csvImportDesc}</p>
              
              <div className="mt-3 space-y-2">
                <button
                  onClick={downloadTemplate}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  {t.downloadTemplate}
                </button>
                
                <div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCsvFile(file);
                        handleCsvUpload(file);
                      }
                    }}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                  >
                    {uploading ? "Uploading..." : t.uploadCsv}
                  </label>
                </div>
                
                <p className="text-xs text-slate-500">{t.csvFormatHint}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Manual Entry Option */}
        <div className="border border-slate-200 rounded-lg p-4 hover:border-green-300 transition">
          <div className="flex items-start space-x-3">
            <FileText className="w-6 h-6 text-green-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">{t.manualEntry}</h3>
              <p className="text-sm text-slate-600 mt-1">{t.manualEntryDesc}</p>
              
              <button
                onClick={() => {
                  updateStoreData("importMethod", "manual");
                  // TODO: Could open product creation modal or navigate to product page
                }}
                className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
              >
                Start Adding Products
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Import Results */}
      {importResult && (
        <div className="mt-4">
          {importResult.error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <span className="text-sm text-red-800">{importResult.error}</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  {importResult.imported} products imported successfully!
                </span>
              </div>
              {importResult.errors?.length > 0 && (
                <div className="mt-2 text-xs text-orange-700">
                  <div className="font-medium">{importResult.errors.length} rows had issues:</div>
                  <ul className="mt-1 space-y-1">
                    {importResult.errors.slice(0, 3).map((error: string, idx: number) => (
                      <li key={idx}>• {error}</li>
                    ))}
                    {importResult.errors.length > 3 && (
                      <li>• ... and {importResult.errors.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {storeData.productsImported && !importResult && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">Products imported successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomizationStep({ storeData, updateStoreData, t }: any) {
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("desktop");
  
  const colors = [
    { name: "Indigo", value: "indigo", color: "bg-indigo-500" },
    { name: "Blue", value: "blue", color: "bg-blue-500" },
    { name: "Green", value: "green", color: "bg-green-500" },
    { name: "Purple", value: "purple", color: "bg-purple-500" },
    { name: "Pink", value: "pink", color: "bg-pink-500" },
    { name: "Red", value: "red", color: "bg-red-500" },
  ];
  
  const templates = [
    { name: "Classic", value: "classic", desc: "Traditional layout" },
    { name: "Modern", value: "modern", desc: "Clean and minimal" },
    { name: "Boutique", value: "boutique", desc: "Elegant design" },
  ];
  
  const headerStyles = [
    { name: "Compact", value: "compact", desc: "Simple header" },
    { name: "Full", value: "full", desc: "Logo + navigation" },
    { name: "Minimal", value: "minimal", desc: "Logo only" },
  ];
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{t.customizeTitle}</h2>
      <p className="text-slate-600 mb-6">{t.customizeSubtitle}</p>
      
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Customization Controls */}
        <div className="space-y-4">
          {/* Theme Color */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.themeColor}
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateStoreData("themeColor", color.value)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm
                    ${storeData.themeColor === color.value ? 
                      'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}
                  `}
                >
                  <div className={`w-4 h-4 rounded-full ${color.color}`} />
                  <span>{color.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Store Template */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.storeTemplate}
            </label>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.value}
                  onClick={() => updateStoreData("storeTemplate", template.value)}
                  className={`
                    w-full text-left p-3 rounded-lg border text-sm
                    ${storeData.storeTemplate === template.value ? 
                      'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
                  `}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-slate-500">{template.desc}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Header Style */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.headerStyle}
            </label>
            <div className="space-y-2">
              {headerStyles.map((style) => (
                <button
                  key={style.value}
                  onClick={() => updateStoreData("headerStyle", style.value)}
                  className={`
                    w-full text-left p-3 rounded-lg border text-sm
                    ${storeData.headerStyle === style.value ? 
                      'border-green-400 bg-green-50' : 'border-slate-200 hover:border-slate-300'}
                  `}
                >
                  <div className="font-medium">{style.name}</div>
                  <div className="text-slate-500">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Preview */}
        <div className="lg:sticky lg:top-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-700">
              {t.previewStore}
            </label>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`px-3 py-1 text-xs rounded-md flex items-center space-x-1 ${
                  previewMode === "desktop" ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`px-3 py-1 text-xs rounded-md flex items-center space-x-1 ${
                  previewMode === "mobile" ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </button>
            </div>
          </div>
          
          {/* Mock Preview */}
          <div className={`
            border border-slate-200 rounded-lg overflow-hidden bg-white
            ${previewMode === "mobile" ? 'max-w-sm mx-auto' : ''}
          `}>
            <div className={`p-4 border-b ${
              storeData.themeColor === 'indigo' ? 'bg-indigo-500' :
              storeData.themeColor === 'blue' ? 'bg-blue-500' :
              storeData.themeColor === 'green' ? 'bg-green-500' :
              storeData.themeColor === 'purple' ? 'bg-purple-500' :
              storeData.themeColor === 'pink' ? 'bg-pink-500' :
              'bg-red-500'
            }`}>
              <div className="text-white font-medium">
                {storeData.name || "Your Store Name"}
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-100 aspect-square rounded"></div>
                <div className="bg-slate-100 aspect-square rounded"></div>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Preview of your store with {storeData.storeTemplate} template
              </div>
            </div>
          </div>
          
          {/* Full Preview Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams({
                  name: storeData.name || "Your Store Name",
                  color: storeData.themeColor,
                  template: storeData.storeTemplate,
                  header: storeData.headerStyle,
                  ...(storeData.logoUrl && { logo: storeData.logoUrl }),
                });
                window.open(`/setup/preview?${params.toString()}`, '_blank');
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              <Eye className="w-4 h-4" />
              <span>{t.previewStore}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationStep({ storeData, updateStoreData, t }: any) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{t.verifyTitle}</h2>
      <p className="text-slate-600 mb-6">{t.verifySubtitle}</p>
      
      <div className="grid gap-4 max-w-lg">
        <Field
          label={t.businessName}
          value={storeData.businessName}
          placeholder={t.businessNamePh}
          onChange={(v: string) => updateStoreData("businessName", v)}
        />
        
        <Field
          label={t.businessReg}
          value={storeData.businessReg}
          placeholder={t.businessRegPh}
          onChange={(v: string) => updateStoreData("businessReg", v)}
        />
        
        <Field
          label={t.ownerName}
          value={storeData.ownerName}
          placeholder={t.ownerNamePh}
          onChange={(v: string) => updateStoreData("ownerName", v)}
        />
        
        <Field
          label={t.phone}
          value={storeData.phone}
          placeholder={t.phonePh}
          onChange={(v: string) => updateStoreData("phone", v)}
        />
        
        <div>
          <label className="text-sm text-slate-700">{t.address}</label>
          <textarea
            value={storeData.address}
            placeholder={t.addressPh}
            onChange={(e) => updateStoreData("address", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-blue-200 transition focus:ring"
            rows={3}
          />
        </div>
        
        <div className="mt-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={storeData.verified}
              onChange={(e) => updateStoreData("verified", e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">
              I confirm this information is accurate
            </span>
          </label>
        </div>
        
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Verification benefits:</strong> Verified stores get a trust badge, 
            higher search ranking, and customer confidence boost.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChecklistStep({ storeData, t }: any) {
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/stores/onboarding-status', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setOnboardingStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch onboarding status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, []);

  // Use local data as fallback if API hasn't loaded yet
  const tasks = onboardingStatus ? [
    {
      key: "storeInfo",
      title: t.tasks.storeInfo,
      completed: onboardingStatus.status.storeInfo.completed,
      action: null,
    },
    {
      key: "firstProduct", 
      title: t.tasks.firstProduct,
      completed: onboardingStatus.status.products.completed,
      action: onboardingStatus.status.products.completed ? null : { text: "Add Products", href: "/dashboard/catalog" },
    },
    {
      key: "storeCustomized",
      title: t.tasks.storeCustomized,
      completed: onboardingStatus.status.customization.completed,
      action: null, // Already customized in this wizard
    },
    {
      key: "businessVerified",
      title: t.tasks.businessVerified,
      completed: onboardingStatus.status.verification.completed,
      action: null, // Was handled in previous step
    },
    {
      key: "shippingSet",
      title: t.tasks.shippingSet,
      completed: onboardingStatus.status.shipping.completed,
      action: onboardingStatus.status.shipping.completed ? null : { text: "Set Shipping", href: "/dashboard/shipping" },
    },
    {
      key: "paymentSet", 
      title: t.tasks.paymentSet,
      completed: onboardingStatus.status.payment.completed,
      action: onboardingStatus.status.payment.completed ? null : { text: "Set Payment", href: "/dashboard/settings" },
    },
  ] : [
    // Fallback tasks using local data
    {
      key: "storeInfo",
      title: t.tasks.storeInfo,
      completed: !!(storeData.name && storeData.city),
      action: null,
    },
    {
      key: "firstProduct", 
      title: t.tasks.firstProduct,
      completed: storeData.productsImported || storeData.importMethod === "manual",
      action: storeData.productsImported ? null : { text: "Add Products", href: "/dashboard/catalog" },
    },
    {
      key: "storeCustomized",
      title: t.tasks.storeCustomized,
      completed: storeData.themeColor !== "indigo" || storeData.storeTemplate !== "classic",
      action: null,
    },
    {
      key: "businessVerified",
      title: t.tasks.businessVerified,
      completed: storeData.verified && storeData.businessName,
      action: null,
    },
    {
      key: "shippingSet",
      title: t.tasks.shippingSet,
      completed: false,
      action: { text: "Set Shipping", href: "/dashboard/shipping" },
    },
    {
      key: "paymentSet", 
      title: t.tasks.paymentSet,
      completed: false,
      action: { text: "Set Payment", href: "/dashboard/settings" },
    },
  ];
  
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progress = (completedTasks / totalTasks) * 100;
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{t.checklistTitle}</h2>
      <p className="text-slate-600 mb-6">{t.checklistSubtitle}</p>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Setup Progress</span>
          <span className="text-sm text-slate-600">{completedTasks}/{totalTasks} completed</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Task list */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 bg-white">
                <div className="w-5 h-5 rounded-full bg-slate-200 animate-pulse"></div>
                <div className="flex-1 h-4 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.key}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                task.completed ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  w-5 h-5 rounded-full flex items-center justify-center border-2
                  ${task.completed ? 
                    'border-green-500 bg-green-500' : 'border-slate-300 bg-white'}
                `}>
                  {task.completed && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className={`text-sm ${
                  task.completed ? 'text-green-800' : 'text-slate-700'
                }`}>
                  {task.title}
                </span>
              </div>
              
              {/* Action button for incomplete tasks */}
              {!task.completed && task.action && (
                <a
                  href={task.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                >
                  {task.action.text}
                </a>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Launch CTA */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-center">
        <div className="text-2xl mb-2">🚀</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {progress === 100 ? "You're ready to launch!" : "Almost there!"}
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          {progress === 100 ? 
            "Your store is set up and ready to start selling." :
            `Complete ${totalTasks - completedTasks} more item${totalTasks - completedTasks > 1 ? 's' : ''} to launch your store.`
          }
        </p>
        
        {progress === 100 && (
          <div className="flex justify-center space-x-3">
            <button className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200">
              <Eye className="w-4 h-4 inline mr-1" />
              Preview Store
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable field component
function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-lg border bg-white px-3 py-2 outline-none ring-blue-200 transition focus:ring ${
          error ? "border-rose-400" : "border-slate-300"
        }`}
      />
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}