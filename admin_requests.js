
const RequestManagement = {
     template: `
    <div class="container mt-4">
      <h2 class="text-center mb-4">Service Requests</h2>

      <!-- Tab Navigation -->
      <div class="btn-group mb-3" role="group">
        <button
          @click="activeTab = 'ongoing'"
          :class="['btn', activeTab === 'ongoing' ? 'btn-primary' : 'btn-outline-primary']"
        >
          Ongoing Requests
        </button>
        <button
          @click="activeTab = 'closed'"
          :class="['btn', activeTab === 'closed' ? 'btn-success' : 'btn-outline-success']"
        >
          Closed Requests
        </button>
        <button
          @click="activeTab = 'cancelled'"
          :class="['btn', activeTab === 'cancelled' ? 'btn-danger' : 'btn-outline-danger']"
        >
          Cancelled Requests
        </button>
      </div>

      <!-- Requests Table -->
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Request ID</th>
            <th>Service</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in filteredRequests" :key="request.id">
            <td>{{ request.id }}</td>
            <td>{{ request.service_name }}</td>
            <td>{{ request.customer_name }}</td>
            <td>{{ formatDate(request.date_of_request) }}</td>
            <td>{{ request.service_status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  data() {
    return {
      requests: [],
      activeTab: 'ongoing'
    };
  },
  computed: {
    filteredRequests() {
      const statusMap = {
        'ongoing': ['requested', 'assigned'],
        'closed': ['closed'],
        'cancelled': ['cancelled']
      };

      return this.requests.filter(request =>
        statusMap[this.activeTab].includes(request.service_status.toLowerCase())
      );
    }
  },
  methods: {
    formatDate(dateString) {
      return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
    },
    fetchRequests() {
      axios.get('http://127.0.0.1:5000/admin/service-requests')
        .then(response => {
          this.requests = response.data;
        })
        .catch(error => {
          console.error('Error fetching requests:', error);
        });
    }
  },
  created() {
    this.fetchRequests();
  }
};
