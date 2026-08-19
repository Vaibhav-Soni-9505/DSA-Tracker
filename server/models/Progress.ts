import mongoose, { Schema, Document } from "mongoose";

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  problemId: string;
  solved: boolean;
  firstSolvedAt: string | null;
  revisionStage: number;
  nextRevisionAt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemId: {
      type: String,
      required: true,
    },
    solved: {
      type: Boolean,
      required: true,
      default: false,
    },
    firstSolvedAt: {
      type: String,
      default: null,
      validate: {
        validator: function (v: string | null) {
          if (v === null) return true;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
          const d = new Date(v);
          return !isNaN(d.getTime());
        },
        message: (props) => `${props.value} is not a valid YYYY-MM-DD date!`,
      },
    },
    revisionStage: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "{VALUE} is not an integer value",
      },
    },
    nextRevisionAt: {
      type: String,
      default: null,
      validate: {
        validator: function (v: string | null) {
          if (v === null) return true;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
          const d = new Date(v);
          return !isNaN(d.getTime());
        },
        message: (props) => `${props.value} is not a valid YYYY-MM-DD date!`,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index for user + problem
progressSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export const Progress = mongoose.model<IProgress>("Progress", progressSchema);
