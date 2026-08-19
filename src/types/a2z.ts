export interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  problemUrl: string;
  articleUrl?: string;
  order: number;
}

export interface Topic {
  id: string;
  title: string;
  order: number;
  problems: Problem[];
}

export interface Step {
  id: string;
  title: string;
  order: number;
  topics: Topic[];
}
