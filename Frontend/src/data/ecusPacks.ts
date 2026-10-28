export interface EcusPack {
  ecus: number;
  price: string;
  popular: boolean;
  bonus?: string;
}

export const ECUS_PACKS: EcusPack[] = [
  { ecus: 50, price: '0,99 €', popular: false },
  { ecus: 150, price: '2,49 €', popular: true, bonus: '+20%' },
  { ecus: 350, price: '4,99 €', popular: false, bonus: '+40%' },
  { ecus: 750, price: '9,99 €', popular: false, bonus: '+50%' },
  { ecus: 1650, price: '19,99 €', popular: false, bonus: '+65%' },
];
