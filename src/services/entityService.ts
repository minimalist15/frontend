import { NetworkNodeBuilder } from './networkNodeBuilder';
import { NetworkLinkBuilder } from './networkLinkBuilder';

export interface NetworkData {
  nodes: any[];
  links: any[];
}

export class EntityService {
  static async getNetworkData(): Promise<NetworkData> {
    try {
      // Get network nodes and links from the respective builders
      const nodes = await NetworkNodeBuilder.createNetworkNodes();
      const links = await NetworkLinkBuilder.createNetworkLinks();
      
      return {
        nodes,
        links
      };
    } catch (error) {
      console.error('Error fetching network data:', error);
      throw error;
    }
  }
}