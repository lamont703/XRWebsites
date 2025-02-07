import { getContainer } from '../database.js';

module.exports = async function (context, myTimer) {
    try {
        const container = await getContainer();
        const archiveContainer = await getArchiveContainer();
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Query for deleted forum content
        const querySpec = {
            query: "SELECT * FROM c WHERE c.status = 'deleted' AND c.deletedAt < @threshold AND (c.type = 'forum_post' OR c.type = 'forum_comment')",
            parameters: [{ name: "@threshold", value: thirtyDaysAgo.toISOString() }]
        };
        
        const { resources } = await container.items.query(querySpec).fetchAll();
        
        for (const item of resources) {
            // Add archive metadata
            const archiveItem = {
                ...item,
                archivedAt: new Date().toISOString(),
                originalType: item.type,
                type: 'archived_content'
            };
            
            // Create in archive container and delete from main container
            await archiveContainer.items.create(archiveItem);
            await container.item(item.id, item.type).delete();
        }
        
        context.log(`Archived ${resources.length} items`);
    } catch (error) {
        context.log.error('Error in archiving content:', error);
        throw error;
    }
}; 