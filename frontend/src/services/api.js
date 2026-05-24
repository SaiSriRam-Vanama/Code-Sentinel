import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const api = {
    analyzePR: async (repoOwner, repoName, prNumber) => {
        const response = await axios.post(`${API_URL}/analyze`, {
            repo_owner: repoOwner,
            repo_name: repoName,
            pr_number: parseInt(prNumber, 10)
        });
        return response.data;
    },
    
    getPRStatus: async (prId) => {
        const response = await axios.get(`${API_URL}/pr/${prId}`);
        return response.data;
    },
    
    listPRs: async () => {
        const response = await axios.get(`${API_URL}/prs`);
        return response.data;
    }
};
