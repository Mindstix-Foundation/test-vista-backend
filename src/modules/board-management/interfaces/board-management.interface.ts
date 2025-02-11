export interface BoardManagementData {
  board: {
    id: number;
    name: string;
    abbreviation: string;
    address_id: number;
    created_at: Date;
    updated_at: Date;
  };
  address: {
    id: number;
    street: string;
    city_id: number;
    postal_code: string;
    created_at: Date;
    updated_at: Date;
  };
  standards: {
    id: number;
    name: string;
    board_id: number;
    created_at: Date;
    updated_at: Date;
  }[];
  subjects: {
    id: number;
    name: string;
    board_id: number;
    created_at: Date;
    updated_at: Date;
  }[];
  instruction_mediums: {
    id: number;
    instruction_medium: string;
    board_id: number;
    created_at: Date;
    updated_at: Date;
  }[];
} 