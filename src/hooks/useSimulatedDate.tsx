import React, { createContext, useContext, useState } from "react";

interface SimulatedDateContextType {
  today: Date;
  nextDay: () => void;
  prevDay: () => void;
  resetDate: () => void;
  isSimulated: boolean;
}

const SimulatedDateContext = createContext<SimulatedDateContextType | undefined>(undefined);

export const SimulatedDateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);

  const today = simulatedDate || new Date();
  const isSimulated = simulatedDate !== null;

  const nextDay = () => {
    setSimulatedDate((prev) => {
      const target = prev || new Date();
      const next = new Date(target);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const prevDay = () => {
    setSimulatedDate((prev) => {
      const target = prev || new Date();
      const next = new Date(target);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const resetDate = () => {
    setSimulatedDate(null);
  };

  return (
    <SimulatedDateContext.Provider value={{ today, nextDay, prevDay, resetDate, isSimulated }}>
      {children}
    </SimulatedDateContext.Provider>
  );
};

export const useSimulatedDate = () => {
  const context = useContext(SimulatedDateContext);
  if (!context) {
    throw new Error("useSimulatedDate must be used within a SimulatedDateProvider");
  }
  return context;
};
