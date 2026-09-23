import React, { useState, useEffect } from 'react';
import { productionCostService } from '../services/productionCostService';
import type { ProductionCostRecord, ProductionCostResponse } from '../services/productionCostService';
import { PrivacyDataModal } from '../components/PrivacyDataModal';
import {
  Calculator,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Edit3,
  Coins,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import LoadSpinner from '../components/LoadSpinner';
import '../styles/CalculatorPage.css';

export const ProductionCalculatorPage: React.FC = () => {
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.expectedQuantity <= 0) {
        setError('Expected yield quantity must be greater than zero');
        return;
      }

      const dataToSubmit = { ...formData };
      if (
        dataToSubmit.expectedSellingPrice === undefined ||
        dataToSubmit.expectedSellingPrice === null ||
        Number.isNaN(dataToSubmit.expectedSellingPrice)
      ) {
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
      setError(err.response?.data?.error?.message || 'Failed to save calculation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this calculation?')) return;
    try {
      await productionCostService.deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.record._id !== id));
      if (editingId === id) handleCancelEdit();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete record');
    }
  };

  const handleEdit = (record: ProductionCostRecord & { _id?: string }) => {
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
    setScenarios((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const resetScenario = (id: string, defaultQuantity: number, defaultPrice?: number) => {
    setScenarios((prev) => ({
      ...prev,
      [id]: { quantity: defaultQuantity, sellingPrice: defaultPrice || 0 },
    }));
  };

  const renderMoney = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'N/A';
    return `KES ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="calc-page">
      <header className="calc-header">
        <div className="calc-title-row">
          <div className="calc-title-icon" aria-hidden="true">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="calc-title">Production Cost Calculator</h1>
            <p className="calc-subtitle">
              Calculate total production costs, unit breakeven prices, and estimate farm profit margins.
            </p>
          </div>
        </div>

        <div className="calc-info-notice">
          <div className="calc-info-notice-header">
            <ShieldCheck size={16} />
            <span>Confidential & Private Cost Intelligence</span>
          </div>
          <p>
            Your production-cost entries remain 100% private to your account and are never disclosed to buyers, brokers,
            or shown on public crop listings. This data gives you objective bargaining power during negotiations.
          </p>
          <button type="button" className="calc-info-btn" onClick={() => setShowPrivacyModal(true)}>
            Learn about our farmer privacy guarantee &rarr;
          </button>
        </div>

        <div className="calc-disclaimer">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2, color: '#f5a623' }} />
          <div>
            <strong>Disclaimer:</strong> This is an informational estimation tool based on your self-reported inputs.
            It does not constitute financial advice or mandatory pricing instructions.
          </div>
        </div>
      </header>

      {error && <div className="calc-error">{error}</div>}

      <div className="calc-grid">
        {/* ── Form Section ── */}
        <section className="calc-form-card" aria-label="Calculator Form">
          <h2 className="calc-form-heading">
            {editingId ? 'Edit Calculation' : 'Add New Calculation'}
          </h2>
          <p className="calc-form-subheading">
            Enter your expected harvest yield and itemized expenses below.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="calc-form-group">
              <label className="calc-label" htmlFor="calcCropName">
                Crop / Product Name <span className="calc-required">*</span>
              </label>
              <input
                id="calcCropName"
                type="text"
                name="cropName"
                className="calc-input"
                value={formData.cropName}
                onChange={handleChange}
                placeholder="e.g. Yellow Maize, Hass Avocado, Tomatoes"
                required
              />
            </div>

            <div className="calc-form-row-2">
              <div className="calc-form-group">
                <label className="calc-label" htmlFor="calcExpectedQuantity">
                  Expected Yield Quantity <span className="calc-required">*</span>
                </label>
                <input
                  id="calcExpectedQuantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="expectedQuantity"
                  className="calc-input"
                  value={formData.expectedQuantity}
                  onChange={handleChange}
                  required
                />
                <span className="calc-helper-text">
                  Used to calculate your cost per unit and estimate total revenue.
                </span>
              </div>

              <div className="calc-form-group">
                <label className="calc-label" htmlFor="calcQuantityUnit">
                  Quantity Unit <span className="calc-required">*</span>
                </label>
                <select
                  id="calcQuantityUnit"
                  name="quantityUnit"
                  className="calc-select"
                  value={formData.quantityUnit}
                  onChange={handleChange}
                >
                  <option value="kg">KG</option>
                  <option value="tonne">Tonne</option>
                  <option value="bag">90kg Bag</option>
                  <option value="crate">Crate</option>
                </select>
              </div>
            </div>

            <fieldset className="calc-fieldset">
              <legend className="calc-legend">
                <Coins size={14} /> Production Costs (KES)
              </legend>
              <div className="calc-cost-grid">
                <div className="calc-form-group">
                  <label className="calc-label" htmlFor="calcSeedCost">Seed / Input Cost</label>
                  <input
                    id="calcSeedCost"
                    type="number"
                    min="0"
                    step="0.01"
                    name="seedCost"
                    className="calc-input"
                    value={formData.seedCost}
                    onChange={handleChange}
                  />
                </div>
                <div className="calc-form-group">
                  <label className="calc-label" htmlFor="calcFertilizerCost">Fertilizer Cost</label>
                  <input
                    id="calcFertilizerCost"
                    type="number"
                    min="0"
                    step="0.01"
                    name="fertilizerCost"
                    className="calc-input"
                    value={formData.fertilizerCost}
                    onChange={handleChange}
                  />
                </div>
                <div className="calc-form-group">
                  <label className="calc-label" htmlFor="calcLabourCost">Labour Cost</label>
                  <input
                    id="calcLabourCost"
                    type="number"
                    min="0"
                    step="0.01"
                    name="labourCost"
                    className="calc-input"
                    value={formData.labourCost}
                    onChange={handleChange}
                  />
                  <span className="calc-helper-text">
                    Field preparation, weeding & harvesting costs.
                  </span>
                </div>
                <div className="calc-form-group">
                  <label className="calc-label" htmlFor="calcTransportCost">Transport Cost</label>
                  <input
                    id="calcTransportCost"
                    type="number"
                    min="0"
                    step="0.01"
                    name="transportCost"
                    className="calc-input"
                    value={formData.transportCost}
                    onChange={handleChange}
                  />
                  <span className="calc-helper-text">
                    Hauling from farm to storage or collection point.
                  </span>
                </div>
                <div className="calc-form-group">
                  <label className="calc-label" htmlFor="calcStorageCost">Storage Cost</label>
                  <input
                    id="calcStorageCost"
                    type="number"
                    min="0"
                    step="0.01"
                    name="storageCost"
                    className="calc-input"
                    value={formData.storageCost}
                    onChange={handleChange}
                  />
                </div>
                <div className="calc-form-group">
                  <label className="calc-label" htmlFor="calcOtherCost">Other / Contingency</label>
                  <input
                    id="calcOtherCost"
                    type="number"
                    min="0"
                    step="0.01"
                    name="otherCost"
                    className="calc-input"
                    value={formData.otherCost}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </fieldset>

            <div className="calc-form-group">
              <label className="calc-label" htmlFor="calcSellingPrice">
                Expected Selling Price per {formData.quantityUnit} (Optional)
              </label>
              <input
                id="calcSellingPrice"
                type="number"
                min="0"
                step="0.01"
                name="expectedSellingPrice"
                className="calc-input"
                value={formData.expectedSellingPrice ?? ''}
                onChange={handleChange}
                placeholder="e.g. 50"
              />
              <span className="calc-helper-text">
                Used to project potential gross revenue and profit/loss margins.
              </span>
            </div>

            <div className="calc-form-actions">
              <button type="submit" className="calc-btn-primary">
                <Calculator size={17} />
                <span>{editingId ? 'Save Changes' : 'Calculate & Save'}</span>
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="calc-btn-cancel">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ── Results Section ── */}
        <section className="calc-results-column" aria-label="Saved Calculations">
          <div className="calc-results-title">
            <span>Your Calculations</span>
            {records.length > 0 && (
              <span className="calc-count-badge">
                {records.length} {records.length === 1 ? 'record' : 'records'}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '60px 0' }}>
              <LoadSpinner size="md" text="Loading calculations..." />
            </div>
          ) : records.length === 0 ? (
            <div className="calc-empty-card">
              <Calculator size={44} opacity={0.35} />
              <h4>No calculations saved yet</h4>
              <p style={{ margin: 0, fontSize: '0.86rem', maxWidth: 320 }}>
                Fill in the form on the left to calculate your unit costs and find your minimum profitable selling price.
              </p>
            </div>
          ) : (
            records.map(({ record, metrics }) => {
              const scenario = scenarios[record._id!] || {
                quantity: record.expectedQuantity,
                sellingPrice: record.expectedSellingPrice || 0,
              };
              const simQuantity = scenario.quantity > 0 ? scenario.quantity : 1;
              const simCostPerUnit = metrics.totalCost / simQuantity;
              const simRevenue = scenario.sellingPrice * simQuantity;
              const simProfit = simRevenue - metrics.totalCost;

              return (
                <article key={record._id} className="calc-record-card">
                  {/* Card Header */}
                  <div className="calc-record-header">
                    <div className="calc-record-crop-info">
                      <h3 className="calc-record-crop-name">{record.cropName}</h3>
                      <span className="calc-record-badge">
                        {record.expectedQuantity} {record.quantityUnit}
                      </span>
                    </div>
                    <div className="calc-record-actions">
                      <button
                        type="button"
                        onClick={() => handleEdit(record)}
                        className="calc-action-btn calc-action-btn--edit"
                        title="Edit calculation"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(record._id!)}
                        className="calc-action-btn calc-action-btn--del"
                        title="Delete calculation"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="calc-record-body">
                    {/* Primary Metrics */}
                    <div className="calc-metrics-grid">
                      <div className="calc-metric-box">
                        <span className="calc-metric-label">Expected Yield</span>
                        <span className="calc-metric-value">
                          {record.expectedQuantity} {record.quantityUnit}
                        </span>
                      </div>

                      <div className="calc-metric-box">
                        <span className="calc-metric-label">Total Production Cost</span>
                        <span className="calc-metric-value">{renderMoney(metrics.totalCost)}</span>
                        <details className="calc-why-details">
                          <summary className="calc-why-summary">
                            <HelpCircle size={11} /> Why is this calculated?
                          </summary>
                          <div className="calc-why-content">
                            Total amount spent producing this crop based on your itemized inputs.
                          </div>
                        </details>
                      </div>

                      <div className="calc-metric-box calc-metric-box--highlight">
                        <span className="calc-metric-label">Cost per {record.quantityUnit}</span>
                        <span className="calc-metric-value">{renderMoney(metrics.costPerUnit)}</span>
                        <details className="calc-why-details">
                          <summary className="calc-why-summary">
                            <HelpCircle size={11} /> Why is this calculated?
                          </summary>
                          <div className="calc-why-content">
                            Represents the baseline expense incurred to produce 1 unit of this crop.
                          </div>
                        </details>
                      </div>

                      <div className="calc-metric-box calc-metric-box--amber">
                        <span className="calc-metric-label">Break-Even Price</span>
                        <span className="calc-metric-value">{renderMoney(metrics.breakEvenPrice)}</span>
                        <details className="calc-why-details">
                          <summary className="calc-why-summary">
                            <HelpCircle size={11} /> Why is this calculated?
                          </summary>
                          <div className="calc-why-content">
                            The minimum price per unit you need to receive to recover all recorded expenses.
                          </div>
                        </details>
                      </div>
                    </div>

                    {/* Cost Breakdown Table */}
                    <div className="calc-section-divider">
                      <div className="calc-section-title">
                        <span>Production Cost Breakdown</span>
                      </div>
                      <details className="calc-why-details" style={{ marginBottom: 8 }}>
                        <summary className="calc-why-summary">
                          <HelpCircle size={11} /> Why do we show this?
                        </summary>
                        <div className="calc-why-content">
                          Identifies which expense categories take up the largest share of your budget.
                        </div>
                      </details>

                      {metrics.costBreakdown && metrics.costBreakdown.length > 0 ? (
                        <table className="calc-breakdown-table">
                          <tbody>
                            {metrics.costBreakdown
                              .filter((item) => item.amount > 0)
                              .map((item, idx) => (
                                <tr key={idx}>
                                  <td className="calc-td-category">{item.category.replace(' costs', '')}</td>
                                  <td className="calc-td-amount">{renderMoney(item.amount)}</td>
                                  <td className="calc-td-pct">
                                    <span className="calc-pct-tag">{item.percentage}%</span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ fontSize: '0.84rem', color: '#6d967a', margin: 0 }}>No itemized costs recorded.</p>
                      )}
                    </div>

                    {/* Revenue & Profit Projections */}
                    <div className="calc-section-divider">
                      <div className="calc-section-title">
                        <span>Estimates at Expected Price</span>
                      </div>
                      {record.expectedSellingPrice != null ? (
                        <div className="calc-rev-grid">
                          <div className="calc-rev-card">
                            <span className="calc-metric-label" style={{ color: '#5ec285' }}>
                              Estimated Gross Revenue
                            </span>
                            <div className="calc-metric-value" style={{ color: '#ffffff', marginTop: 4 }}>
                              {renderMoney(metrics.estimatedRevenue)}
                            </div>
                            <span className="calc-helper-text">
                              Based on {record.expectedQuantity} {record.quantityUnit} &times; KES {record.expectedSellingPrice}
                            </span>
                          </div>

                          <div
                            className={`calc-rev-card ${
                              (metrics.estimatedProfitLoss ?? 0) >= 0
                                ? 'calc-rev-card--profit'
                                : 'calc-rev-card--loss'
                            }`}
                          >
                            <span
                              className="calc-metric-label"
                              style={{
                                color: (metrics.estimatedProfitLoss ?? 0) >= 0 ? '#5ec285' : '#f87171',
                              }}
                            >
                              Estimated {(metrics.estimatedProfitLoss ?? 0) >= 0 ? 'Net Profit' : 'Net Loss'}
                            </span>
                            <div
                              className="calc-metric-value"
                              style={{
                                color: (metrics.estimatedProfitLoss ?? 0) >= 0 ? '#5ec285' : '#f87171',
                                marginTop: 4,
                              }}
                            >
                              {renderMoney(metrics.estimatedProfitLoss)}
                            </div>
                            <span className="calc-helper-text">
                              Revenue minus total recorded production cost.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.85rem', color: '#6d967a', fontStyle: 'italic', margin: '6px 0 0 0' }}>
                          No selling price was provided. Add an expected price to see projected profit or loss.
                        </p>
                      )}
                    </div>

                    {/* What-If Simulation Box */}
                    <div className="calc-sim-box">
                      <div className="calc-sim-header">
                        <h4 className="calc-sim-title">
                          <Sparkles size={15} color="#5ec285" />
                          <span>What-If Scenario Simulator</span>
                          <span className="calc-sim-badge">Simulation</span>
                        </h4>
                      </div>
                      <span className="calc-helper-text" style={{ display: 'block', marginBottom: 12 }}>
                        Simulate changes to yield quantity or target selling prices without modifying your saved record.
                      </span>

                      <div className="calc-sim-inputs">
                        <div>
                          <label className="calc-label" style={{ fontSize: '0.78rem' }}>Simulated Yield</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className="calc-input"
                            style={{ padding: '8px 10px', fontSize: '0.86rem' }}
                            value={scenario.quantity}
                            onChange={(e) =>
                              handleScenarioChange(record._id!, 'quantity', Number(e.target.value))
                            }
                          />
                        </div>
                        <div>
                          <label className="calc-label" style={{ fontSize: '0.78rem' }}>Simulated Selling Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="calc-input"
                            style={{ padding: '8px 10px', fontSize: '0.86rem' }}
                            value={scenario.sellingPrice}
                            onChange={(e) =>
                              handleScenarioChange(record._id!, 'sellingPrice', Number(e.target.value))
                            }
                          />
                        </div>
                      </div>

                      <div className="calc-sim-results-grid">
                        <div>Simulated Total Cost: <strong>{renderMoney(metrics.totalCost)}</strong></div>
                        <div>Simulated Unit Cost: <strong>{renderMoney(simCostPerUnit)}</strong></div>
                        <div>Simulated Revenue: <strong>{renderMoney(simRevenue)}</strong></div>
                        <div>
                          Simulated Margin:{' '}
                          <span className={simProfit >= 0 ? 'calc-sim-profit-pos' : 'calc-sim-profit-neg'}>
                            {renderMoney(simProfit)}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="calc-sim-reset-btn"
                          onClick={() =>
                            resetScenario(
                              record._id!,
                              record.expectedQuantity,
                              record.expectedSellingPrice
                            )
                          }
                        >
                          Reset Simulation
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      {showPrivacyModal && <PrivacyDataModal onClose={() => setShowPrivacyModal(false)} />}
    </div>
  );
};

export default ProductionCalculatorPage;
