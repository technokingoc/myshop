"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/lib/language";
import { useToast } from "@/components/toast-provider";
import {
  Plus, X, GripVertical, Trash2, Package, Save, 
  Layers3, AlertTriangle, Settings, ZoomIn
} from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { CategorySelect } from "@/components/category-select";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ProductVariant = {
  id?: number;
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string;
  attributes: Record<string, string>;
  sortOrder: number;
  active: boolean;
};

type ProductFormData = {
  id?: number;
  name: string;
  type: "Product" | "Service";
  category: string;
  shortDescription: string;
  price: string;
  compareAtPrice: string;
  status: "Draft" | "Published";
  imageUrl: string;
  imageUrls: string[];
  stockQuantity: number;
  trackInventory: boolean;
  lowStockThreshold: number;
  hasVariants: boolean;
  variants: ProductVariant[];
};

const initialFormData: ProductFormData = {
  name: "",
  type: "Product",
  category: "",
  shortDescription: "",
  price: "",
  compareAtPrice: "",
  status: "Draft",
  imageUrl: "",
  imageUrls: [],
  stockQuantity: 0,
  trackInventory: false,
  lowStockThreshold: 5,
  hasVariants: false,
  variants: [],
};

// Sortable Image Component for drag-and-drop reordering
function SortableImage({ 
  url, 
  index, 
  onRemove, 
  onUpdate 
}: { 
  url: string; 
  index: number; 
  onRemove: (index: number) => void;
  onUpdate: (index: number, url: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `image-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square rounded-lg border border-slate-200 bg-white overflow-hidden"
    >
      {url ? (
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover transition-transform duration-200 hover:scale-110"
        />
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
          <ImageUpload
            currentUrl=""
            onUrlChange={(newUrl) => onUpdate(index, newUrl)}
          />
        </div>
      )}
      
      {/* Zoom overlay on hover */}
      {url && (
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
          <ZoomIn className="h-6 w-6 text-white drop-shadow-lg" />
        </div>
      )}
      
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1 rounded bg-white/80 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="h-4 w-4 text-slate-600" />
      </button>
      
      {/* Remove button */}
      {url && (
        <button
          onClick={() => onRemove(index)}
          className="absolute top-2 right-2 p-1 rounded bg-red-500 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 text-white"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// Variant Form Component
function VariantForm({ 
  variant, 
  index, 
  onUpdate, 
  onRemove 
}: {
  variant: ProductVariant;
  index: number;
  onUpdate: (index: number, updates: Partial<ProductVariant>) => void;
  onRemove: (index: number) => void;
}) {
  const { lang } = useLanguage();
  
  const isLowStock = variant.stockQuantity <= variant.lowStockThreshold && variant.stockQuantity > 0;
  const isOutOfStock = variant.stockQuantity === 0;
  
  return (
    <div className="p-4 border border-slate-200 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-900">
          Variant {index + 1}
          {isOutOfStock && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Out of stock
            </span>
          )}
          {isLowStock && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Low stock
            </span>
          )}
        </h4>
        <button
          onClick={() => onRemove(index)}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Variant Name</label>
          <input
            type="text"
            value={variant.name}
            onChange={(e) => onUpdate(index, { name: e.target.value })}
            placeholder="e.g., Large / Red"
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">SKU</label>
          <input
            type="text"
            value={variant.sku}
            onChange={(e) => onUpdate(index, { sku: e.target.value })}
            placeholder="Optional"
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Price</label>
          <input
            type="number"
            step="0.01"
            value={variant.price}
            onChange={(e) => onUpdate(index, { price: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Compare at Price</label>
          <input
            type="number"
            step="0.01"
            value={variant.compareAtPrice}
            onChange={(e) => onUpdate(index, { compareAtPrice: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Stock Quantity</label>
          <input
            type="number"
            value={variant.stockQuantity}
            onChange={(e) => onUpdate(index, { stockQuantity: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Low Stock Threshold</label>
          <input
            type="number"
            value={variant.lowStockThreshold}
            onChange={(e) => onUpdate(index, { lowStockThreshold: parseInt(e.target.value) || 5 })}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>
      
      {/* Variant Image */}
      <div>
        <label className="text-sm font-medium text-slate-700">Variant Image</label>
        <div className="mt-1">
          <ImageUpload
            currentUrl={variant.imageUrl}
            onUrlChange={(url) => onUpdate(index, { imageUrl: url })}
          />
        </div>
      </div>
      
      {/* Attributes */}
      <div>
        <label className="text-sm font-medium text-slate-700">Attributes</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Size"
            value={variant.attributes.size || ""}
            onChange={(e) => 
              onUpdate(index, { 
                attributes: { ...variant.attributes, size: e.target.value }
              })
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Color"
            value={variant.attributes.color || ""}
            onChange={(e) => 
              onUpdate(index, { 
                attributes: { ...variant.attributes, color: e.target.value }
              })
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Material"
            value={variant.attributes.material || ""}
            onChange={(e) => 
              onUpdate(index, { 
                attributes: { ...variant.attributes, material: e.target.value }
              })
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  );
}

export function EnhancedProductForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: Partial<ProductFormData>;
  onSave: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { lang } = useLanguage();
  const toast = useToast();
  
  const [formData, setFormData] = useState<ProductFormData>({
    ...initialFormData,
    ...initialData,
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // Image drag and drop handlers
  const handleImageDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);
  
  const handleImageDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = parseInt(String(active.id).replace('image-', ''));
        const newIndex = parseInt(String(over.id).replace('image-', ''));
        const newImageUrls = arrayMove(prev.imageUrls, oldIndex, newIndex);
        return { ...prev, imageUrls: newImageUrls };
      });
    }
    
    setActiveId(null);
  }, []);
  
  // Add new variant
  const addVariant = useCallback(() => {
    const newVariant: ProductVariant = {
      name: "",
      sku: "",
      price: formData.price,
      compareAtPrice: "",
      stockQuantity: 0,
      lowStockThreshold: 5,
      imageUrl: "",
      attributes: {},
      sortOrder: formData.variants.length,
      active: true,
    };
    
    setFormData(prev => ({
      ...prev,
      hasVariants: true,
      variants: [...prev.variants, newVariant],
    }));
  }, [formData.price, formData.variants.length]);
  
  // Update variant
  const updateVariant = useCallback((index: number, updates: Partial<ProductVariant>) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === index ? { ...v, ...updates } : v),
    }));
  }, []);
  
  // Remove variant
  const removeVariant = useCallback((index: number) => {
    setFormData(prev => {
      const newVariants = prev.variants.filter((_, i) => i !== index);
      return {
        ...prev,
        variants: newVariants,
        hasVariants: newVariants.length > 0,
      };
    });
  }, []);
  
  // Add image
  const addImage = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ""],
    }));
  }, []);
  
  // Update image
  const updateImage = useCallback((index: number, url: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.map((u, i) => i === index ? url : u),
    }));
  }, []);
  
  // Remove image
  const removeImage = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  }, []);
  
  // Handle save
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    
    setSaving(true);
    try {
      await onSave(formData);
      toast.success("Product saved successfully");
    } catch (error) {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          {formData.id ? "Edit Product" : "Add Product"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>
      
      <div className="space-y-8">
        {/* Basic Information */}
        <section>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Enter product name"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Category</label>
              <CategorySelect
                value={formData.category}
                onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as "Product" | "Service" }))}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Product">Product</option>
                <option value="Service">Service</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700">Compare at Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, compareAtPrice: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={formData.shortDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Product description"
              />
            </div>
          </div>
        </section>
        
        {/* Images with drag-and-drop */}
        <section>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Images</h3>
          
          {/* Main image */}
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700">Main Image</label>
            <div className="mt-1">
              <ImageUpload
                currentUrl={formData.imageUrl}
                onUrlChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              />
            </div>
          </div>
          
          {/* Additional images with drag-and-drop */}
          <div>
            <label className="text-sm font-medium text-slate-700">Additional Images</label>
            <p className="text-xs text-slate-500 mt-1">Drag to reorder images</p>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleImageDragStart}
              onDragEnd={handleImageDragEnd}
            >
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <SortableContext
                  items={formData.imageUrls.map((_, i) => `image-${i}`)}
                  strategy={horizontalListSortingStrategy}
                >
                  {formData.imageUrls.map((url, index) => (
                    <SortableImage
                      key={index}
                      url={url}
                      index={index}
                      onRemove={removeImage}
                      onUpdate={updateImage}
                    />
                  ))}
                </SortableContext>
                
                {/* Add image button */}
                {formData.imageUrls.length < 8 && (
                  <button
                    onClick={addImage}
                    className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-slate-400 hover:text-slate-500 transition-colors"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                )}
              </div>
              
              <DragOverlay>
                {activeId ? (
                  <div className="aspect-square rounded-lg bg-white border border-slate-300 shadow-lg">
                    <div className="w-full h-full bg-slate-100 rounded-lg"></div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </section>
        
        {/* Inventory Management */}
        <section>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Inventory Management</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.trackInventory}
                onChange={(e) => setFormData(prev => ({ ...prev, trackInventory: e.target.checked }))}
                className="rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">Track inventory</span>
            </label>
            
            {formData.trackInventory && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="text-sm font-medium text-slate-700">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Low Stock Alert</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 5 }))}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Variants Management */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Product Variants</h3>
            <button
              onClick={addVariant}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Variant
            </button>
          </div>
          
          {formData.variants.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
              <Layers3 className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm text-slate-500">No variants added yet</p>
              <p className="text-xs text-slate-400">Add variants for different sizes, colors, or materials</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <VariantForm
                  key={index}
                  variant={variant}
                  index={index}
                  onUpdate={updateVariant}
                  onRemove={removeVariant}
                />
              ))}
            </div>
          )}
        </section>
        
        {/* Status */}
        <section>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Status</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFormData(prev => ({ ...prev, status: "Draft" }))}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                formData.status === "Draft"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-300 text-slate-700 hover:border-slate-400"
              }`}
            >
              Draft
            </button>
            <button
              onClick={() => setFormData(prev => ({ ...prev, status: "Published" }))}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                formData.status === "Published"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-700 hover:border-slate-400"
              }`}
            >
              Published
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}