'use client';

import { useState, useEffect } from 'react';
import { getDict, type AppLang } from '@/lib/i18n';
import { Plus, Edit, Trash2, MapPin, Truck, Package, Clock } from 'lucide-react';

interface ShippingZone {
  id: number;
  name: string;
  regions: string[];
  countries: string[];
  active: boolean;
  methods: ShippingMethod[];
}

interface ShippingMethod {
  id: number;
  name: string;
  type: 'flat_rate' | 'weight_based' | 'free' | 'pickup';
  rate: number;
  freeShippingMinOrder: number;
  estimatedDays: number;
  maxWeight: number;
  pickupAddress?: string;
  pickupInstructions?: string;
  active: boolean;
}

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [showMethodForm, setShowMethodForm] = useState<number | null>(null);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  
  const dict = getDict('en'); // TODO: Get language from context

  useEffect(() => {
    loadShippingZones();
  }, []);

  const loadShippingZones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/shipping/zones');
      if (response.ok) {
        const data = await response.json();
        setZones(data.zones || []);
      }
    } catch (error) {
      console.error('Failed to load shipping zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleZoneSubmit = async (formData: FormData) => {
    const zoneData = {
      name: formData.get('name') as string,
      regions: (formData.get('regions') as string).split(',').map(r => r.trim()).filter(Boolean),
      countries: (formData.get('countries') as string).split(',').map(c => c.trim()).filter(Boolean),
      active: formData.get('active') === 'on'
    };

    try {
      const response = await fetch('/api/dashboard/shipping/zones', {
        method: editingZone ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...zoneData,
          ...(editingZone && { id: editingZone.id })
        })
      });

      if (response.ok) {
        await loadShippingZones();
        setShowZoneForm(false);
        setEditingZone(null);
      }
    } catch (error) {
      console.error('Failed to save zone:', error);
    }
  };

  const handleMethodSubmit = async (zoneId: number, formData: FormData) => {
    const methodData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      rate: parseFloat(formData.get('rate') as string) || 0,
      freeShippingMinOrder: parseFloat(formData.get('freeShippingMinOrder') as string) || 0,
      estimatedDays: parseInt(formData.get('estimatedDays') as string) || 3,
      maxWeight: parseFloat(formData.get('maxWeight') as string) || 0,
      pickupAddress: formData.get('pickupAddress') as string || '',
      pickupInstructions: formData.get('pickupInstructions') as string || '',
      active: formData.get('active') === 'on'
    };

    try {
      const response = await fetch('/api/dashboard/shipping/methods', {
        method: editingMethod ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...methodData,
          zoneId,
          ...(editingMethod && { id: editingMethod.id })
        })
      });

      if (response.ok) {
        await loadShippingZones();
        setShowMethodForm(null);
        setEditingMethod(null);
      }
    } catch (error) {
      console.error('Failed to save method:', error);
    }
  };

  const deleteZone = async (zoneId: number) => {
    if (!confirm('Are you sure you want to delete this shipping zone?')) return;
    
    try {
      const response = await fetch(`/api/dashboard/shipping/zones?id=${zoneId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadShippingZones();
      }
    } catch (error) {
      console.error('Failed to delete zone:', error);
    }
  };

  const deleteMethod = async (methodId: number) => {
    if (!confirm('Are you sure you want to delete this shipping method?')) return;
    
    try {
      const response = await fetch(`/api/dashboard/shipping/methods?id=${methodId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadShippingZones();
      }
    } catch (error) {
      console.error('Failed to delete method:', error);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'pickup': return <Package className="w-4 h-4" />;
      case 'free': return <Truck className="w-4 h-4 text-green-600" />;
      default: return <Truck className="w-4 h-4" />;
    }
  };

  const formatMethodType = (type: string) => {
    switch (type) {
      case 'flat_rate': return 'Flat Rate';
      case 'weight_based': return 'Weight Based';
      case 'free': return 'Free Shipping';
      case 'pickup': return 'Pickup';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping & Delivery</h1>
          <p className="text-gray-600">Manage your shipping zones and delivery methods</p>
        </div>
        <button
          onClick={() => setShowZoneForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Zone
        </button>
      </div>

      {zones.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shipping zones configured</h3>
          <p className="text-gray-500 mb-4">Create your first shipping zone to start managing delivery options</p>
          <button
            onClick={() => setShowZoneForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Shipping Zone
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {zones.map((zone) => (
            <div key={zone.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {zone.regions.length > 0 && (
                        <p><span className="font-medium">Regions:</span> {zone.regions.join(', ')}</p>
                      )}
                      {zone.countries.length > 0 && (
                        <p><span className="font-medium">Countries:</span> {zone.countries.join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      zone.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {zone.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingZone(zone);
                        setShowZoneForm(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteZone(zone.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Shipping Methods</h4>
                  <button
                    onClick={() => setShowMethodForm(zone.id)}
                    className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Method
                  </button>
                </div>

                {zone.methods && zone.methods.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {zone.methods.map((method) => (
                      <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-2">
                            {getMethodIcon(method.type)}
                            <span className="font-medium text-gray-900">{method.name}</span>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                setEditingMethod(method);
                                setShowMethodForm(zone.id);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteMethod(method.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="font-medium text-blue-600">{formatMethodType(method.type)}</p>
                          
                          {method.type !== 'free' && method.type !== 'pickup' && (
                            <p className="font-semibold text-gray-900">
                              ${method.rate.toFixed(2)}
                              {method.type === 'weight_based' && '/kg'}
                            </p>
                          )}
                          
                          {method.freeShippingMinOrder > 0 && (
                            <p className="text-green-600">
                              Free shipping over ${method.freeShippingMinOrder.toFixed(2)}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{method.estimatedDays} days delivery</span>
                          </div>
                          
                          {method.type === 'pickup' && method.pickupAddress && (
                            <p className="text-blue-600">📍 {method.pickupAddress}</p>
                          )}
                          
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                            method.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {method.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No shipping methods configured for this zone</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zone Form Modal */}
      {showZoneForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingZone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleZoneSubmit(new FormData(e.currentTarget));
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingZone?.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regions/Cities (comma-separated)
                  </label>
                  <input
                    name="regions"
                    type="text"
                    defaultValue={editingZone?.regions.join(', ')}
                    placeholder="Maputo, Matola, Beira"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Countries (comma-separated)
                  </label>
                  <input
                    name="countries"
                    type="text"
                    defaultValue={editingZone?.countries.join(', ')}
                    placeholder="Mozambique, South Africa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={editingZone?.active ?? true}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowZoneForm(false);
                    setEditingZone(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingZone ? 'Update' : 'Create'} Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Method Form Modal */}
      {showMethodForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (showMethodForm) {
                handleMethodSubmit(showMethodForm, new FormData(e.currentTarget));
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingMethod?.name}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    defaultValue={editingMethod?.type || 'flat_rate'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="flat_rate">Flat Rate</option>
                    <option value="weight_based">Weight Based</option>
                    <option value="free">Free Shipping</option>
                    <option value="pickup">Pickup</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate (USD)
                  </label>
                  <input
                    name="rate"
                    type="number"
                    step="0.01"
                    defaultValue={editingMethod?.rate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Free Shipping Minimum Order (USD)
                  </label>
                  <input
                    name="freeShippingMinOrder"
                    type="number"
                    step="0.01"
                    defaultValue={editingMethod?.freeShippingMinOrder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Delivery Days
                  </label>
                  <input
                    name="estimatedDays"
                    type="number"
                    defaultValue={editingMethod?.estimatedDays || 3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Weight (kg, 0 = no limit)
                  </label>
                  <input
                    name="maxWeight"
                    type="number"
                    step="0.01"
                    defaultValue={editingMethod?.maxWeight}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Address (for pickup methods)
                  </label>
                  <input
                    name="pickupAddress"
                    type="text"
                    defaultValue={editingMethod?.pickupAddress}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Instructions
                  </label>
                  <textarea
                    name="pickupInstructions"
                    defaultValue={editingMethod?.pickupInstructions}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={editingMethod?.active ?? true}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowMethodForm(null);
                    setEditingMethod(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingMethod ? 'Update' : 'Create'} Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}