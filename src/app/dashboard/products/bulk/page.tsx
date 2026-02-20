"use client";

import { useLanguage } from "@/lib/language";
import { 
  Package, 
  CheckSquare,
  Square,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Undo2,
  Trash2,
  Eye,
  EyeOff,
  Archive,
  Tag,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  price: string;
  status: string;
  category: string;
  stockQuantity: number;
  trackInventory: boolean;
  imageUrl?: string;
  createdAt: string;
  sellerId: number;
}

interface BulkJob {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total: number;
  processed: number;
  errors: string[];
  createdAt: string;
}

interface PriceHistory {
  id: number;
  productId: number;
  oldPrice: string;
  newPrice: string;
  changeType: 'percentage' | 'fixed' | 'set';
  changeValue: string;
  jobId: string;
  canUndo: boolean;
  createdAt: string;
}

export default function BulkOperationsPage() {
  const { t } = useLanguage();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);

  // Bulk action states
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Price adjustment form
  const [priceAction, setPriceAction] = useState<'increase' | 'decrease' | 'set'>('increase');
  const [priceType, setPriceType] = useState<'percentage' | 'fixed'>('percentage');
  const [priceValue, setPriceValue] = useState("");
  
  // Category assignment form
  const [newCategory, setNewCategory] = useState("");
  const [availableCategories] = useState([
    'Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 
    'Health & Beauty', 'Food & Beverages', 'Toys', 'Other'
  ]);

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Load bulk jobs
  const loadBulkJobs = async () => {
    try {
      const response = await fetch('/api/dashboard/products/bulk/jobs');
      if (!response.ok) return;
      
      const data = await response.json();
      setBulkJobs(data.jobs || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  // Load price history
  const loadPriceHistory = async () => {
    try {
      const response = await fetch('/api/dashboard/products/bulk/price-history');
      if (!response.ok) return;
      
      const data = await response.json();
      setPriceHistory(data.history || []);
    } catch (error) {
      console.error('Error loading price history:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadBulkJobs();
    loadPriceHistory();
    
    // Poll for job updates
    const interval = setInterval(() => {
      loadBulkJobs();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && product.status !== statusFilter) {
        return false;
      }
      
      // Category filter
      if (categoryFilter !== 'all' && product.category !== categoryFilter) {
        return false;
      }
      
      // Stock filter
      if (stockFilter === 'in_stock' && product.stockQuantity <= 0) {
        return false;
      }
      if (stockFilter === 'out_of_stock' && product.stockQuantity > 0) {
        return false;
      }
      if (stockFilter === 'low_stock' && product.stockQuantity > 5) {
        return false;
      }
      
      return true;
    });
  }, [products, searchTerm, statusFilter, categoryFilter, stockFilter]);

  // Selection handlers
  const selectAll = () => {
    const allIds = new Set(filteredProducts.map(p => p.id));
    setSelectedProducts(allIds);
  };

  const selectNone = () => {
    setSelectedProducts(new Set());
  };

  const toggleProduct = (id: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  // Quick select filters
  const selectByFilter = (filter: string) => {
    let filtered: Product[] = [];
    
    switch (filter) {
      case 'out_of_stock':
        filtered = filteredProducts.filter(p => p.stockQuantity <= 0);
        break;
      case 'draft':
        filtered = filteredProducts.filter(p => p.status === 'Draft');
        break;
      case 'published':
        filtered = filteredProducts.filter(p => p.status === 'Published');
        break;
      default:
        return;
    }
    
    const ids = new Set(filtered.map(p => p.id));
    setSelectedProducts(ids);
    toast.success(`Selected ${ids.size} products`);
  };

  // Bulk actions
  const performBulkAction = async (action: string, data?: any) => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/dashboard/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          productIds: Array.from(selectedProducts),
          data
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Bulk action failed');
      }

      const result = await response.json();
      
      if (result.jobId) {
        toast.success(`Bulk ${action} started - Job ID: ${result.jobId}`);
        loadBulkJobs();
      } else {
        toast.success(`Bulk ${action} completed - ${result.updated || result.deleted || 0} products affected`);
        await loadProducts();
        setSelectedProducts(new Set());
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error(error instanceof Error ? error.message : 'Bulk action failed');
    } finally {
      setLoading(false);
    }
  };

  // Price adjustment
  const handlePriceAdjustment = async () => {
    if (!priceValue) {
      toast.error('Please enter a price value');
      return;
    }

    const data = {
      action: priceAction,
      type: priceType,
      value: priceValue
    };

    await performBulkAction('adjust_price', data);
    setShowPriceDialog(false);
    setPriceValue("");
  };

  // Category assignment
  const handleCategoryAssignment = async () => {
    if (!newCategory) {
      toast.error('Please select a category');
      return;
    }

    await performBulkAction('assign_category', { category: newCategory });
    setShowCategoryDialog(false);
    setNewCategory("");
  };

  // Undo price change
  const undoPriceChange = async (jobId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/dashboard/products/bulk/price-history/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Undo failed');
      }

      toast.success('Price changes undone successfully');
      await loadProducts();
      await loadPriceHistory();
    } catch (error) {
      console.error('Undo error:', error);
      toast.error(error instanceof Error ? error.message : 'Undo failed');
    } finally {
      setLoading(false);
    }
  };

  // Running jobs
  const runningJobs = bulkJobs.filter(job => job.status === 'running');

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8" />
            Bulk Operations
          </h1>
        </div>
        <p className="text-gray-600">
          Manage multiple products at once with bulk actions
        </p>
      </div>

      {/* Running Jobs */}
      {runningJobs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Running Jobs
            </CardTitle>
            <CardDescription>Background operations in progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {runningJobs.map(job => (
              <div key={job.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{job.type.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-600">
                    {job.processed} / {job.total}
                  </span>
                </div>
                <Progress value={job.progress} className="w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Price Changes */}
      {priceHistory.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5" />
              Recent Price Changes
            </CardTitle>
            <CardDescription>Undo bulk price adjustments within 24 hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {priceHistory.slice(0, 3).map(history => (
              <div key={history.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {history.changeType === 'percentage' 
                      ? `${history.changeValue}% ${history.oldPrice < history.newPrice ? 'increase' : 'decrease'}`
                      : `Set to ${history.newPrice}`
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    Job {history.jobId} • {new Date(history.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {history.canUndo && (
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => undoPriceChange(history.jobId)}
                    disabled={loading}
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Undo
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock (≤5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Selection */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="h-4 w-4 mr-2" />
              All Filtered ({filteredProducts.length})
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              <Square className="h-4 w-4 mr-2" />
              None
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => selectByFilter('out_of_stock')}
            >
              Out of Stock
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => selectByFilter('draft')}
            >
              Draft Products
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => selectByFilter('published')}
            >
              Published Products
            </Button>
          </div>

          {selectedProducts.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">
                {selectedProducts.size} products selected
              </span>
              <Button variant="ghost" size="sm" onClick={selectNone}>
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
            <CardDescription>
              Actions will be applied to {selectedProducts.size} selected products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Price Adjustment */}
              <Button
                variant="outline"
                onClick={() => setShowPriceDialog(true)}
                disabled={loading}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Adjust Price
              </Button>

              {/* Category Assignment */}
              <Button
                variant="outline"
                onClick={() => setShowCategoryDialog(true)}
                disabled={loading}
              >
                <Tag className="h-4 w-4 mr-2" />
                Set Category
              </Button>

              {/* Publish */}
              <Button
                variant="outline"
                onClick={() => performBulkAction('publish')}
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </Button>

              {/* Unpublish */}
              <Button
                variant="outline"
                onClick={() => performBulkAction('unpublish')}
                disabled={loading}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Unpublish
              </Button>

              {/* Archive */}
              <Button
                variant="outline"
                onClick={() => performBulkAction('archive')}
                disabled={loading}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>

              {/* Delete */}
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            {searchTerm && `Filtered by "${searchTerm}" • `}
            {statusFilter !== 'all' && `Status: ${statusFilter} • `}
            {categoryFilter !== 'all' && `Category: ${categoryFilter} • `}
            {stockFilter !== 'all' && `Stock: ${stockFilter.replace('_', ' ')}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                        onChange={selectedProducts.size === filteredProducts.length ? selectNone : selectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-3 px-2">Product</th>
                    <th className="text-left py-3 px-2">Price</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Category</th>
                    <th className="text-left py-3 px-2">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr 
                      key={product.id} 
                      className={`border-b hover:bg-gray-50 ${selectedProducts.has(product.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => toggleProduct(product.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {product.imageUrl && (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono">
                        ${product.price}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={product.status === 'Published' ? 'default' : 'secondary'}>
                          {product.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        {product.category || 'Uncategorized'}
                      </td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant={product.stockQuantity <= 0 ? 'destructive' : 
                                   product.stockQuantity <= 5 ? 'secondary' : 'default'}
                        >
                          {product.trackInventory ? product.stockQuantity : 'Unlimited'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Adjustment Dialog */}
      {showPriceDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Adjust Prices</CardTitle>
              <CardDescription>
                Apply price changes to {selectedProducts.size} selected products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Price Action</Label>
                <Select value={priceAction} onValueChange={(value: any) => setPriceAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Increase Prices
                      </div>
                    </SelectItem>
                    <SelectItem value="decrease">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Decrease Prices
                      </div>
                    </SelectItem>
                    <SelectItem value="set">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4" />
                        Set Fixed Price
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {priceAction !== 'set' && (
                <div className="space-y-2">
                  <Label>Value Type</Label>
                  <Select value={priceType} onValueChange={(value: any) => setPriceType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  {priceAction === 'set' ? 'New Price' : 
                   priceType === 'percentage' ? 'Percentage' : 'Amount'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  step={priceType === 'percentage' ? '1' : '0.01'}
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder={priceAction === 'set' ? '99.99' : 
                              priceType === 'percentage' ? '10' : '5.00'}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={handlePriceAdjustment}
                  disabled={!priceValue || loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Apply Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPriceDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Assignment Dialog */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Assign Category</CardTitle>
              <CardDescription>
                Set category for {selectedProducts.size} selected products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={handleCategoryAssignment}
                  disabled={!newCategory || loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Assign Category
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCategoryDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Confirm Delete
              </CardTitle>
              <CardDescription>
                This will permanently delete {selectedProducts.size} selected products.
                This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ All product data, images, and reviews will be lost permanently.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="destructive"
                  className="flex-1" 
                  onClick={() => {
                    performBulkAction('delete');
                    setShowDeleteDialog(false);
                  }}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Yes, Delete {selectedProducts.size} Products
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}