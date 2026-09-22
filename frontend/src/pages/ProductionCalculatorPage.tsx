import React, { useState, useEffect } from 'react';
import { productionCostService } from '../services/productionCostService';
import type { ProductionCostRecord, ProductionCostResponse } from '../services/productionCostService';
import { useAuth } from '../hooks/useAuth';
import { PrivacyDataModal } from '../components/PrivacyDataModal';

export const ProductionCalculatorPage: React.FC = () => {
  const { } = useAuth();
  
  const [records, setRecords] = useState<ProductionCostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Scenarios keyed by record ID
  const [scenarios, setScenarios] = useState<Record<string, { quantity: number; sellingPrice: number }>>({});

  const [formData, setFormData] = useState<ProductionCostRecord>({
    cropName: '',
    expectedQuantity: 1,
    quantityUnit: 'kg',
    seedCost: 0,
    fertilizerCost: 0,
    labourCost: 0,
    transportCost: 0,
    storageCost: 0,
    otherCost: 0,
    expectedSellingPrice: undefined,
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await productionCostService.getMyRecords();
      setRecords(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.expectedQuantity <= 0) {
        setError('Expected quantity must be greater than zero');
        return;
      }
      
      const dataToSubmit = { ...formData };
      if (dataToSubmit.expectedSellingPrice === undefined || dataToSubmit.expectedSellingPrice === null || Number.isNaN(dataToSubmit.expectedSellingPrice)) {
        delete dataToSubmit.expectedSellingPrice;
      }
      
      if (editingId) {
        await productionCostService.updateRecord(editingId, dataToSubmit);
      } else {
        await productionCostService.createRecord(dataToSubmit);
      }
      
      fetchRecords(); 
      
      setFormData({
        cropName: '',
        expectedQuantity: 1,
        quantityUnit: 'kg',
        seedCost: 0,
        fertilizerCost: 0,
        labourCost: 0,
        transportCost: 0,
        storageCost: 0,
        otherCost: 0,
        expectedSellingPrice: undefined,
      });
      setEditingId(null);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save record');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productionCostService.deleteRecord(id);
      if (editingId === id) handleCancelEdit();
      fetchRecords();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete record');
    }
  };

  const handleEdit = (record: ProductionCostRecord) => {
    setEditingId(record._id || null);
    setFormData({
      cropName: record.cropName,
      expectedQuantity: record.expectedQuantity,
      quantityUnit: record.quantityUnit,
      seedCost: record.seedCost,
      fertilizerCost: record.fertilizerCost,
      labourCost: record.labourCost,
      transportCost: record.transportCost,
      storageCost: record.storageCost,
      otherCost: record.otherCost,
      expectedSellingPrice: record.expectedSellingPrice,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      cropName: '',
      expectedQuantity: 1,
      quantityUnit: 'kg',
      seedCost: 0,
      fertilizerCost: 0,
      labourCost: 0,
      transportCost: 0,
      storageCost: 0,
      otherCost: 0,
      expectedSellingPrice: undefined,
    });
    setError(null);
  };

  const handleScenarioChange = (id: string, field: 'quantity' | 'sellingPrice', value: number) => {
    setScenarios(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const resetScenario = (id: string, defaultQuantity: number, defaultPrice?: number) => {
    setScenarios(prev => ({
      ...prev,
      [id]: { quantity: defaultQuantity, sellingPrice: defaultPrice || 0 }
    }));
  };

  const renderMoney = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';
    return `KES ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="calculator-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h2>Private Production Calculator</h2>
        
        {/* TOP-OF-FORM "WHY?" EXPLANATION */}
        <div style={{ backgroundColor: '#eef2ff', padding: '15px', borderRadius: '8px', border: '1px solid #c7d2fe', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#3730a3' }}>Why are we asking for your production costs?</h4>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#4338ca' }}>
            This information helps you calculate your total production cost, cost per unit, break-even price and estimated profit or loss. Your production-cost information is private and is not shown on your public farmer profile.
          </p>
          <button onClick={() => setShowPrivacyModal(true)} style={{ background: 'none', border: 'none', color: '#4f46e5', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>
            Learn more
          </button>
        </div>

        <div style={{ padding: '10px', backgroundColor: '#e8f4f8', borderRadius: '4px', marginTop: '10px' }}>
          <strong>Disclaimer:</strong> This is an information and calculation tool only, based solely on your estimates. It does not constitute financial advice. We do not instruct you to accept or reject any market prices.
        </div>
      </header>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#fee', color: 'red', marginBottom: '20px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        {/* Form Section */}
        <div style={{ flex: '1 1 400px', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>{editingId ? 'Edit Information' : 'Add New Calculation'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <label style={{ display: 'block', fontWeight: 'bold' }}>Crop / Product Name *</label>
              <input type="text" name="cropName" value={formData.cropName} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Expected Yield Quantity *</label>
                <input type="number" step="0.01" min="0.01" name="expectedQuantity" value={formData.expectedQuantity} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
                <small style={{ color: '#666', display: 'block', marginTop: '4px', fontSize: '0.75rem' }}>
                  Used to calculate your cost per unit and estimate total revenue when a selling price is provided.
                </small>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold' }}>Quantity Unit *</label>
                <select name="quantityUnit" value={formData.quantityUnit} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
                  <option value="kg">KG</option>
                  <option value="tonne">Tonne</option>
                  <option value="bag">90kg Bag</option>
                  <option value="crate">Crate</option>
                </select>
              </div>
            </div>

            <fieldset style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '4px' }}>
              <legend style={{ fontWeight: 'bold' }}>Production Costs (KES)</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label>Seed/Input Cost</label>
                  <input type="number" min="0" step="0.01" name="seedCost" value={formData.seedCost} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>
                <div>
                  <label>Fertilizer Cost</label>
                  <input type="number" min="0" step="0.01" name="fertilizerCost" value={formData.fertilizerCost} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>
                <div>
                  <label>Labour Cost</label>
                  <input type="number" min="0" step="0.01" name="labourCost" value={formData.labourCost} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                  <small style={{ color: '#666', display: 'block', marginTop: '2px', fontSize: '0.7rem' }}>
                    Used to calculate your total production cost. This information remains private.
                  </small>
                </div>
                <div>
                  <label>Transport Cost</label>
                  <input type="number" min="0" step="0.01" name="transportCost" value={formData.transportCost} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                  <small style={{ color: '#666', display: 'block', marginTop: '2px', fontSize: '0.7rem' }}>
                    Helps include the cost of moving your produce when calculating your production cost.
                  </small>
                </div>
                <div>
                  <label>Storage Cost</label>
                  <input type="number" min="0" step="0.01" name="storageCost" value={formData.storageCost} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>
                <div>
                  <label>Other Costs</label>
                  <input type="number" min="0" step="0.01" name="otherCost" value={formData.otherCost} onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>
              </div>
            </fieldset>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold' }}>Expected Selling Price per {formData.quantityUnit} (Optional)</label>
              <input type="number" min="0" step="0.01" name="expectedSellingPrice" value={formData.expectedSellingPrice ?? ''} onChange={handleChange} placeholder="e.g. 50" style={{ width: '100%', padding: '8px' }} />
              <small style={{ color: '#666', display: 'block', marginTop: '4px', fontSize: '0.75rem' }}>
                Used only to calculate estimated revenue and estimated profit or loss. This is not a market price supplied by MavunoTrust.
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editingId ? 'Save Changes' : 'Calculate & Save'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} style={{ flex: 1, padding: '10px', backgroundColor: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results Section */}
        <div style={{ flex: '1 1 500px' }}>
          <h3>Your Calculations</h3>
          {loading ? (
            <p>Loading records...</p>
          ) : records.length === 0 ? (
            <p style={{ color: '#666' }}>No calculations saved yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {records.map(({ record, metrics }) => {
                const scenario = scenarios[record._id!] || { quantity: record.expectedQuantity, sellingPrice: record.expectedSellingPrice || 0 };
                const simQuantity = scenario.quantity > 0 ? scenario.quantity : 1;
                const simCostPerUnit = metrics.totalCost / simQuantity;
                const simRevenue = scenario.sellingPrice * simQuantity;
                const simProfit = simRevenue - metrics.totalCost;

                return (
                  <div key={record._id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0 }}>{record.cropName}</h4>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleEdit(record)} style={{ color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer' }}>Edit Information</button>
                        <button onClick={() => handleDelete(record._id!)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                      <div style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Expected Yield</div>
                        <div style={{ fontWeight: 'bold' }}>{record.expectedQuantity} {record.quantityUnit}</div>
                      </div>
                      <div style={{ padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total production cost</div>
                        <div style={{ fontWeight: 'bold' }}>{renderMoney(metrics.totalCost)}</div>
                        <details style={{ marginTop: '8px' }}>
                          <summary style={{ fontSize: '11px', color: '#666', cursor: 'pointer' }}>ⓘ Why is this calculated?</summary>
                          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', lineHeight: '1.3' }}>It shows the estimated total amount you have spent on producing this crop based on the costs you entered.</div>
                        </details>
                      </div>
                      <div style={{ padding: '10px', backgroundColor: '#eef6fb', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#005b9f' }}>Cost per unit</div>
                        <div style={{ fontWeight: 'bold' }}>{renderMoney(metrics.costPerUnit)}</div>
                        <details style={{ marginTop: '8px' }}>
                          <summary style={{ fontSize: '11px', color: '#005b9f', cursor: 'pointer' }}>ⓘ Why is this calculated?</summary>
                          <div style={{ fontSize: '11px', color: '#005b9f', opacity: 0.8, marginTop: '4px', lineHeight: '1.3' }}>It helps you understand approximately how much it costs to produce one unit of your crop.</div>
                        </details>
                      </div>
                      <div style={{ padding: '10px', backgroundColor: '#fdf3e9', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#c76e00' }}>Break-even price</div>
                        <div style={{ fontWeight: 'bold' }}>{renderMoney(metrics.breakEvenPrice)}</div>
                        <details style={{ marginTop: '8px' }}>
                          <summary style={{ fontSize: '11px', color: '#c76e00', cursor: 'pointer' }}>ⓘ Why is this calculated?</summary>
                          <div style={{ fontSize: '11px', color: '#c76e00', opacity: 0.8, marginTop: '4px', lineHeight: '1.3' }}>It shows the estimated price per unit needed to recover the production costs you entered. It helps you understand the price at which your recorded production costs would be covered.</div>
                        </details>
                      </div>
                    </div>

                    {/* Cost Breakdown Section */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginBottom: '15px' }}>
                      <h5 style={{ margin: '0 0 5px 0' }}>Production Cost Breakdown</h5>
                      <details style={{ marginBottom: '10px' }}>
                        <summary style={{ fontSize: '11px', color: '#666', cursor: 'pointer' }}>ⓘ Why do we show this?</summary>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', lineHeight: '1.3' }}>It helps you see which production expenses contribute most to your total production cost.</div>
                      </details>
                      
                      {metrics.costBreakdown && metrics.costBreakdown.length > 0 ? (
                        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                          <tbody>
                            {metrics.costBreakdown.filter(item => item.amount > 0).map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '4px 0' }}>{item.category.replace(' costs', '')}</td>
                                <td style={{ textAlign: 'right', padding: '4px 0' }}>{renderMoney(item.amount)}</td>
                                <td style={{ textAlign: 'right', padding: '4px 0', width: '60px', fontWeight: 'bold' }}>{item.percentage}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#888' }}>No costs recorded.</p>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                      <h5 style={{ margin: '0 0 10px 0' }}>Estimates based on Expected Selling Price</h5>
                      {record.expectedSellingPrice != null ? (
                        <div style={{ display: 'flex', gap: '15px' }}>
                          <div style={{ flex: 1, padding: '10px', backgroundColor: '#f4fbf4', borderRadius: '4px' }}>
                            <div style={{ fontSize: '12px', color: '#2d7a2d' }}>Estimated Revenue</div>
                            <div style={{ fontWeight: 'bold' }}>{renderMoney(metrics.estimatedRevenue)}</div>
                            <details style={{ marginTop: '8px' }}>
                              <summary style={{ fontSize: '11px', color: '#2d7a2d', cursor: 'pointer' }}>ⓘ Why is this calculated?</summary>
                              <div style={{ fontSize: '11px', color: '#2d7a2d', opacity: 0.8, marginTop: '4px', lineHeight: '1.3' }}>It shows the estimated amount you could receive based on the quantity and selling price you entered.</div>
                            </details>
                          </div>
                          <div style={{ flex: 1, padding: '10px', backgroundColor: metrics.estimatedProfitLoss! >= 0 ? '#f4fbf4' : '#fbf4f4', borderRadius: '4px' }}>
                            <div style={{ fontSize: '12px', color: metrics.estimatedProfitLoss! >= 0 ? '#2d7a2d' : '#a13131' }}>
                              Estimated {metrics.estimatedProfitLoss! >= 0 ? 'Profit' : 'Loss'}
                            </div>
                            <div style={{ fontWeight: 'bold' }}>{renderMoney(metrics.estimatedProfitLoss)}</div>
                            <details style={{ marginTop: '8px' }}>
                              <summary style={{ fontSize: '11px', color: metrics.estimatedProfitLoss! >= 0 ? '#2d7a2d' : '#a13131', cursor: 'pointer' }}>ⓘ Why is this calculated?</summary>
                              <div style={{ fontSize: '11px', color: metrics.estimatedProfitLoss! >= 0 ? '#2d7a2d' : '#a13131', opacity: 0.8, marginTop: '4px', lineHeight: '1.3' }}>It shows the difference between your estimated revenue and the production costs you entered. It is an estimate, not a guarantee of actual profit or loss.</div>
                            </details>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', margin: 0 }}>
                          (No selling price provided. Cannot estimate revenue or profit.)
                        </p>
                      )}
                    </div>

                    {/* What-If Scenario Section */}
                    <div style={{ borderTop: '1px solid #ccc', paddingTop: '15px', marginTop: '20px', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 5px 0', color: '#0f172a', display: 'flex', alignItems: 'center' }}>
                        What-If Scenario 
                        <span style={{ fontSize: '10px', backgroundColor: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '10px', marginLeft: '8px', fontWeight: 'normal' }}>Simulation</span>
                      </h5>
                      <details style={{ marginBottom: '15px' }}>
                        <summary style={{ fontSize: '11px', color: '#475569', cursor: 'pointer' }}>ⓘ Why do we provide this?</summary>
                        <div style={{ fontSize: '11px', color: '#475569', opacity: 0.9, marginTop: '4px', lineHeight: '1.3' }}>It lets you explore how changing the quantity or selling price could affect the calculated result without changing your saved production information. This is a simulation and does not change your saved record.</div>
                      </details>

                      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>Scenario Quantity</label>
                          <input type="number" min="0.01" step="0.01" 
                            value={scenario.quantity} 
                            onChange={(e) => handleScenarioChange(record._id!, 'quantity', Number(e.target.value))} 
                            style={{ width: '100%', padding: '6px', fontSize: '0.9rem' }} 
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>Scenario Selling Price</label>
                          <input type="number" min="0" step="0.01" 
                            value={scenario.sellingPrice} 
                            onChange={(e) => handleScenarioChange(record._id!, 'sellingPrice', Number(e.target.value))} 
                            style={{ width: '100%', padding: '6px', fontSize: '0.9rem' }} 
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                        <div><strong>Scenario Total Cost:</strong> {renderMoney(metrics.totalCost)}</div>
                        <div><strong>Scenario Cost per Unit:</strong> {renderMoney(simCostPerUnit)}</div>
                        <div><strong>Scenario Break-Even:</strong> {renderMoney(simCostPerUnit)}</div>
                        <div><strong>Scenario Revenue:</strong> {renderMoney(simRevenue)}</div>
                        <div style={{ color: simProfit >= 0 ? 'green' : 'red' }}><strong>Scenario Profit/Loss:</strong> {renderMoney(simProfit)}</div>
                      </div>

                      <div style={{ marginTop: '15px', textAlign: 'right' }}>
                        <button onClick={() => resetScenario(record._id!, record.expectedQuantity, record.expectedSellingPrice)} style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}>
                          Reset Scenario
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {showPrivacyModal && <PrivacyDataModal onClose={() => setShowPrivacyModal(false)} />}
    </div>
  );
};

export default ProductionCalculatorPage;
