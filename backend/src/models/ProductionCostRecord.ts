import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProductionCostRecord extends Document {
  farmerId: Types.ObjectId; // ref: User (FARMER only)
  cropName: string;
  expectedQuantity: number;
  quantityUnit: string;
  seedCost: number;
  fertilizerCost: number;
  labourCost: number;
  transportCost: number;
  storageCost: number;
  otherCost: number;
  expectedSellingPrice?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductionCostRecordSchema = new Schema<IProductionCostRecord>(
  {
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Farmer reference is required'],
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    expectedQuantity: {
      type: Number,
      required: [true, 'Expected quantity is required'],
      min: [0.0001, 'Quantity must be greater than 0'],
    },
    quantityUnit: {
      type: String,
      required: [true, 'Quantity unit is required'],
      trim: true,
    },
    seedCost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    fertilizerCost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    labourCost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    transportCost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    storageCost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    otherCost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    expectedSellingPrice: {
      type: Number,
      min: [0, 'Expected selling price cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes must not exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// Optimize queries by farmerId for strict isolation
ProductionCostRecordSchema.index({ farmerId: 1 });

const ProductionCostRecord = mongoose.model<IProductionCostRecord>('ProductionCostRecord', ProductionCostRecordSchema);
export default ProductionCostRecord;
