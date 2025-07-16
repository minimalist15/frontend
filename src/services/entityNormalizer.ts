/**
 * Normalizes entity types to standard format
 */
export class EntityNormalizer {
  /**
   * Normalizes entity type strings to standard format
   */
  static normalizeEntityType(entityType: string): 'PERSON' | 'LOCATION' | 'ORGANIZATION' {
    if (!entityType) return 'ORGANIZATION';
    
    const type = entityType.toUpperCase().trim();
    
    // Handle your database's actual entity types
    if (type === 'PEOPLE') return 'PERSON';
    if (type === 'LOCATIONS') return 'LOCATION';
    if (type === 'ORGANIZATIONS') return 'ORGANIZATION';
    
    // Handle common variations
    if (type.includes('PERSON') || type.includes('PER') || type === 'PEOPLE') {
      return 'PERSON';
    }
    
    if (type.includes('LOCATION') || type.includes('LOC') || type.includes('PLACE') || type === 'LOCATIONS') {
      return 'LOCATION';
    }
    
    if (type.includes('ORG') || type.includes('COMPANY') || type.includes('INSTITUTION') || type === 'ORGANIZATIONS') {
      return 'ORGANIZATION';
    }
    
    // Default fallback
    return 'ORGANIZATION';
  }
}