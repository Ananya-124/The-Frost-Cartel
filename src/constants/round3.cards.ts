export const ROUND3_CARD_CATALOG = [
  { id: 'spectral-lens', name: 'Spectral Lens', description: 'Reveals hidden evidence in the Past timeline.', effect: 'Reveal one hidden evidence clue.', consumption: 'consume-one' },
  { id: 'echo-recorder', name: 'Echo Recorder', description: 'Records an echo for later review.', effect: 'Preserve one discovered sound clue.', consumption: 'consume-one' },
  { id: 'phantom-key', name: 'Phantom Key', description: 'Opens one sealed paradox lock.', effect: 'Unlock one sealed path.', consumption: 'consume-one' },
  { id: 'temporal-compass', name: 'Temporal Compass', description: 'Points toward a timeline transition.', effect: 'Reveal one transition direction.', consumption: 'retained' },
  { id: 'phantom-beacon', name: 'Phantom Beacon', description: 'Marks a location across timelines.', effect: 'Mark one location for return.', consumption: 'consume-one' },
  { id: 'resonance-decoder', name: 'Resonance Decoder', description: 'Decodes one anomalous signal.', effect: 'Decode one signal clue.', consumption: 'consume-one' },
  { id: 'temporal-shield', name: 'Temporal Shield', description: 'Protects one player from a paradox setback.', effect: 'Block one future setback.', consumption: 'consume-one' },
  { id: 'memory-seal', name: 'Memory Seal', description: 'Preserves a clue between timeline changes.', effect: 'Preserve one clue across a transition.', consumption: 'consume-one' },
  { id: 'emergency-power-cell', name: 'Emergency Power Cell', description: 'Restores power to one inactive device.', effect: 'Restore one device activation.', consumption: 'consume-one' },
  { id: 'soul-binding-sigil', name: 'Soul Binding Sigil', description: 'Binds one discovered clue to the current hunt.', effect: 'Secure one discovered clue.', consumption: 'consume-one' },
] as const;

export type Round3CardDefinition = (typeof ROUND3_CARD_CATALOG)[number];
export type Round3CardId = Round3CardDefinition['id'];

export const ROUND3_DEVELOPMENT_SAMPLE_INVENTORY = [
  { cardId: 'spectral-lens', quantity: 1 },
  { cardId: 'temporal-compass', quantity: 1 },
  { cardId: 'emergency-power-cell', quantity: 2 },
] as const;
