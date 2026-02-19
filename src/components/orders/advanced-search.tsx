"use client";

import { useState, useEffect } from "react";
import { Search, Filter, X, Calendar, User, Package, DollarSign } from "lucide-react";
import type { OrderStatus, OrderItem } from "./types";

type SearchFilters = {
  query: string;
  status: OrderStatus | "all";
  dateFrom: string;
  dateTo: string;
  customerName: string;
  customerContact: string;
  itemName: string;
  minAmount: string;
  maxAmount: string;
};

type Props = {
  orders: OrderItem[];
  onFilteredResults: (filtered: OrderItem[]) => void;
  t: Record<string, string>;
};

const initialFilters: SearchFilters = {
  query: "",
  status: "all",
  dateFrom: "",
  dateTo: "",
  customerName: "",
  customerContact: "",
  itemName: "",
  minAmount: "",
  maxAmount: "",
};

export function AdvancedSearch({ orders, onFilteredResults, t }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  // Apply filters to orders
  const applyFilters = () => {
    let filtered = [...orders];

    // General text search
    if (filters.query.trim()) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(query) ||
        order.customerContact.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        (order.itemName && order.itemName.toLowerCase().includes(query)) ||
        (order.message && order.message.toLowerCase().includes(query)) ||
        (order.notes && order.notes.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(order => new Date(order.createdAt) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(order => new Date(order.createdAt) <= toDate);
    }

    // Customer name filter
    if (filters.customerName.trim()) {
      const customerQuery = filters.customerName.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(customerQuery)
      );
    }

    // Customer contact filter
    if (filters.customerContact.trim()) {
      const contactQuery = filters.customerContact.toLowerCase();
      filtered = filtered.filter(order => 
        order.customerContact.toLowerCase().includes(contactQuery)
      );
    }

    // Item name filter
    if (filters.itemName.trim()) {
      const itemQuery = filters.itemName.toLowerCase();
      filtered = filtered.filter(order => 
        order.itemName && order.itemName.toLowerCase().includes(itemQuery)
      );
    }

    // Price range filter
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(order => {
          const price = parseFloat(order.itemPrice || "0");
          return price >= min;
        });
      }
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      if (!isNaN(max)) {
        filtered = filtered.filter(order => {
          const price = parseFloat(order.itemPrice || "0");
          return price <= max;
        });
      }
    }

    onFilteredResults(filtered);
  };

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters();
  }, [filters, orders]);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== "query" && key !== "status" && value !== "" && value !== "all"
  );

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => 
    key !== "query" && value !== "" && value !== "all"
  ).length;

  return (
    <div className="space-y-3">
      {/* Main search bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            placeholder={t.searchPlaceholder || "Search orders, customers, items..."}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
            isOpen || hasActiveFilters 
              ? "border-blue-500 bg-blue-50 text-blue-700" 
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">{t.filters || "Filters"}</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            {t.clearFilters || "Clear"}
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {isOpen && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {t.advancedFilters || "Advanced Filters"}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-200 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.status || "Status"}
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter("status", e.target.value as OrderStatus | "all")}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t.allStatuses || "All Statuses"}</option>
                <option value="placed">{t.placed || "Placed"}</option>
                <option value="confirmed">{t.confirmed || "Confirmed"}</option>
                <option value="processing">{t.processing || "Processing"}</option>
                <option value="shipped">{t.shipped || "Shipped"}</option>
                <option value="delivered">{t.delivered || "Delivered"}</option>
                <option value="cancelled">{t.cancelled || "Cancelled"}</option>
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <Calendar className="inline h-3 w-3 mr-1" />
                {t.dateFrom || "From Date"}
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <Calendar className="inline h-3 w-3 mr-1" />
                {t.dateTo || "To Date"}
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Customer name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <User className="inline h-3 w-3 mr-1" />
                {t.customerName || "Customer Name"}
              </label>
              <input
                type="text"
                value={filters.customerName}
                onChange={(e) => updateFilter("customerName", e.target.value)}
                placeholder={t.customerNamePlaceholder || "Enter customer name..."}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Customer contact */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.customerContact || "Customer Contact"}
              </label>
              <input
                type="text"
                value={filters.customerContact}
                onChange={(e) => updateFilter("customerContact", e.target.value)}
                placeholder={t.contactPlaceholder || "Email or phone..."}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Item name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <Package className="inline h-3 w-3 mr-1" />
                {t.itemName || "Item Name"}
              </label>
              <input
                type="text"
                value={filters.itemName}
                onChange={(e) => updateFilter("itemName", e.target.value)}
                placeholder={t.itemNamePlaceholder || "Enter item name..."}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Min amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <DollarSign className="inline h-3 w-3 mr-1" />
                {t.minAmount || "Min Amount"}
              </label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => updateFilter("minAmount", e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                <DollarSign className="inline h-3 w-3 mr-1" />
                {t.maxAmount || "Max Amount"}
              </label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => updateFilter("maxAmount", e.target.value)}
                placeholder="999.99"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter summary */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {activeFilterCount} {t.activeFilters || "active filters"}
                </span>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {t.clearAll || "Clear All"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}