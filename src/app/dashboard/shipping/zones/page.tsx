'use client';

import { useState, useEffect } from 'react';
import { getDict, type AppLang } from '@/lib/i18n';
import { Plus, Edit, Trash2, MapPin, Globe, Save, X, Map, List } from 'lucide-react';

interface ShippingZone {
  id: number;
  name: string;
  regions: string[];
  countries: string[];
  active: boolean;
  methodCount?: number;
}

export default function ShippingZonesPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const dict = getDict('en'); // TODO: Get language from context

  const [formData, setFormData] = useState({
    name: '',
    regions: '',
    countries: '',
    active: true
  });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/shipping/zones');
      if (response.ok) {
        const data = await response.json();
        const zonesWithCount = data.zones.map((zone: any) => ({
          ...zone,
          methodCount: zone.methods?.length || 0
        }));
        setZones(zonesWithCount);
      }
    } catch (error) {
      console.error('Failed to load zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const zoneData = {
      name: formData.name.trim(),
      regions: formData.regions.split(',').map(r => r.trim()).filter(Boolean),
      countries: formData.countries.split(',').map(c => c.trim()).filter(Boolean),
      active: formData.active
    };

    if (!zoneData.name) {
      alert('Zone name is required');
      return;
    }

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
        await loadZones();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save zone');
      }
    } catch (error) {
      alert('Failed to save zone');
    }
  };

  const deleteZone = async (zoneId: number) => {
    if (!confirm('Are you sure you want to delete this zone? All associated shipping methods will also be deleted.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/dashboard/shipping/zones?id=${zoneId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadZones();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete zone');
      }
    } catch (error) {
      alert('Failed to delete zone');
    }
  };

  const editZone = (zone: ShippingZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      regions: zone.regions.join(', '),
      countries: zone.countries.join(', '),
      active: zone.active
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingZone(null);
    setFormData({
      name: '',
      regions: '',
      countries: '',
      active: true
    });
  };

  const commonRegions = [
    'Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio', 'Nacala', 'Quelimane', 'Tete',
    'Xai-Xai', 'Lichinga', 'Pemba', 'Inhambane', 'Maxixe', 'Gurué', 'Manica'
  ];

  const commonCountries = [
    'Mozambique', 'South Africa', 'Zimbabwe', 'Botswana', 'Tanzania', 'Kenya', 'Angola'
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipping Zones</h1>
          <p className="text-gray-600 mt-1">
            Define geographic areas and their delivery coverage
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'map' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Map</span>
            </button>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Zone
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Zones</p>
              <p className="text-2xl font-semibold text-gray-900">{zones.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Zones</p>
              <p className="text-2xl font-semibold text-gray-900">
                {zones.filter(z => z.active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Regions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {zones.reduce((total, zone) => total + zone.regions.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Globe className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Coverage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(zones.flatMap(z => z.countries)).size} countries
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="space-y-6">
          {zones.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shipping zones</h3>
              <p className="text-gray-500 mb-6">
                Create your first shipping zone to define delivery areas
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Zone
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {zone.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            zone.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {zone.active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {zone.methodCount} method{zone.methodCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => editZone(zone)}
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
                    
                    <div className="space-y-3">
                      {zone.countries.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Countries</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {zone.countries.map((country, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                              >
                                {country}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {zone.regions.length > 0 && (
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Regions</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {zone.regions.slice(0, 3).map((region, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md"
                              >
                                {region}
                              </span>
                            ))}
                            {zone.regions.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{zone.regions.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {zone.countries.length === 0 && zone.regions.length === 0 && (
                        <div className="text-sm text-gray-500 italic">
                          No specific coverage defined (applies everywhere)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Map View Coming Soon</h3>
            <p className="text-gray-500 mb-4">
              Interactive map for visualizing shipping zones will be available in a future update
            </p>
            <button
              onClick={() => setViewMode('list')}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Switch to List View
            </button>
          </div>
        </div>
      )}

      {/* Zone Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editingZone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Greater Maputo Area, Southern Africa"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Countries
                </label>
                <input
                  type="text"
                  value={formData.countries}
                  onChange={(e) => setFormData({ ...formData, countries: e.target.value })}
                  placeholder="Mozambique, South Africa (comma-separated)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Quick add common countries:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonCountries.map(country => (
                      <button
                        key={country}
                        type="button"
                        onClick={() => {
                          const current = formData.countries ? formData.countries.split(', ') : [];
                          if (!current.includes(country)) {
                            setFormData({
                              ...formData,
                              countries: [...current, country].join(', ')
                            });
                          }
                        }}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regions/Cities
                </label>
                <input
                  type="text"
                  value={formData.regions}
                  onChange={(e) => setFormData({ ...formData, regions: e.target.value })}
                  placeholder="Maputo, Matola, Beira (comma-separated)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Quick add major cities:</p>
                  <div className="flex flex-wrap gap-2">
                    {commonRegions.map(region => (
                      <button
                        key={region}
                        type="button"
                        onClick={() => {
                          const current = formData.regions ? formData.regions.split(', ') : [];
                          if (!current.includes(region)) {
                            setFormData({
                              ...formData,
                              regions: [...current, region].join(', ')
                            });
                          }
                        }}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm"
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <label htmlFor="active" className="ml-3 text-sm text-gray-700">
                  Zone is active
                </label>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <MapPin className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Zone Coverage Tips</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Leave both fields empty to create a global zone (ships everywhere)</li>
                        <li>Use countries for broad coverage areas</li>
                        <li>Use regions/cities for specific local delivery zones</li>
                        <li>You can combine both for flexible coverage</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingZone ? 'Update Zone' : 'Create Zone'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}