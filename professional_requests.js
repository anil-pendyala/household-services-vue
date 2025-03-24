// professional-requests.js
const ProfessionalRequests = {
     template: `
       <div class="container mt-4" style="max-width: 1000px;">
         <h2 class="mb-4">Service Requests</h2>

         <div class="alert alert-info mb-4" v-if="!isVerified">
           <strong>Account Verification Pending</strong>
           <p class="mb-0">Your account is awaiting verification by admin. You'll be able to accept service requests once verified.</p>
         </div>

         <!-- Search and filters -->
         <div class="row mb-4">
           <div class="col-md-6">
             <div class="input-group">
               <input
                 type="text"
                 class="form-control"
                 placeholder="Search by location or PIN code..."
                 v-model="searchQuery"
                 @input="filterRequests"
               >
               <button
                 class="btn btn-outline-secondary"
                 type="button"
                 @click="searchQuery = ''; filterRequests()"
                 v-if="searchQuery"
               >
                 Clear
               </button>
             </div>
           </div>
           <div class="col-md-3">
             <select class="form-select" v-model="dateFilter" @change="filterRequests">
               <option value="all">All Dates</option>
               <option value="today">Today</option>
               <option value="tomorrow">Tomorrow</option>
               <option value="week">This Week</option>
             </select>
           </div>
           <div class="col-md-3">
             <select class="form-select" v-model="timeFilter" @change="filterRequests">
               <option value="all">All Times</option>
               <option value="morning">Morning</option>
               <option value="afternoon">Afternoon</option>
               <option value="evening">Evening</option>
             </select>
           </div>
         </div>

         <!-- Loading indicator -->
         <div v-if="loading" class="text-center py-5">
           <div class="spinner-border text-primary" role="status">
             <span class="visually-hidden">Loading...</span>
           </div>
           <p class="mt-2">Loading service requests...</p>
         </div>

         <!-- No requests message -->
         <div v-else-if="filteredRequests.length === 0" class="alert alert-info">
           <p class="mb-0">
             <span v-if="searchQuery || dateFilter !== 'all' || timeFilter !== 'all'">
               No service requests match your filters. Try adjusting your search criteria.
             </span>
             <span v-else>
               There are no pending service requests in your service category at the moment.
             </span>
           </p>
         </div>

         <!-- Requests list -->
         <div v-else>
           <div v-for="request in filteredRequests" :key="request.id" class="card mb-3 shadow-sm">
             <div class="card-body">
               <div class="row">
                 <div class="col-md-8">
                   <h5 class="card-title">{{ request.service_name }}</h5>
                   <p class="card-text">
                     <strong>Requested on:</strong> {{ formatDate(request.date_of_request) }}<br>
                     <strong>Preferred Date:</strong> {{ formatDate(request.preferred_date) }}<br>
                     <strong>Preferred Time:</strong> {{ formatTimeSlot(request.preferred_time) }}<br>
                     <strong>Location:</strong> {{ request.location }} - {{ request.pin_code }}<br>
                     <strong>Customer:</strong> {{ request.customer_name }}
                   </p>
                   <p v-if="request.remarks" class="card-text">
                     <strong>Remarks:</strong> {{ request.remarks }}
                   </p>
                 </div>
                 <div class="col-md-4 d-flex flex-column justify-content-center align-items-end">
                   <button
                     @click="acceptRequest(request.id)"
                     class="btn btn-success w-100 mb-2"
                     :disabled="!isVerified"
                   >
                     Accept Request
                   </button>
                   <button
                     @click="viewCustomerDetails(request.customer_id)"
                     class="btn btn-outline-primary w-100"
                   >
                     View Customer Details
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>

         <!-- Customer details modal -->
         <div class="modal fade" id="customerDetailsModal" tabindex="-1" aria-hidden="true">
           <div class="modal-dialog">
             <div class="modal-content">
               <div class="modal-header">
                 <h5 class="modal-title">Customer Details</h5>
                 <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
               </div>
               <div class="modal-body">
                 <div v-if="selectedCustomer">
                   <p><strong>Name:</strong> {{ selectedCustomer.name }}</p>
                   <p><strong>Location:</strong> {{ selectedCustomer.location }}</p>
                   <p><strong>PIN Code:</strong> {{ selectedCustomer.pin_code }}</p>
                 </div>
                 <div v-else class="text-center">
                   <div class="spinner-border spinner-border-sm text-primary" role="status">
                     <span class="visually-hidden">Loading...</span>
                   </div>
                   <p>Loading customer details...</p>
                 </div>
               </div>
               <div class="modal-footer">
                 <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
               </div>
             </div>
           </div>
         </div>
       </div>
     `,

     data() {
       return {
         requests: [],
         filteredRequests: [],
         searchQuery: '',
         dateFilter: 'all',
         timeFilter: 'all',
         loading: true,
         isVerified: false,
         selectedCustomer: null,
         customerModal: null
       };
     },

     mounted() {
       // Check authentication
       const userId = localStorage.getItem('userId');
       const userRole = localStorage.getItem('userRole');

       if (!userId || userRole !== 'PROFESSIONAL') {
         this.$router.push('/login');
         return;
       }

       // Initialize modal
       this.$nextTick(() => {
         this.customerModal = new bootstrap.Modal(document.getElementById('customerDetailsModal'));
       });

       // Fetch professional's verification status
       this.fetchProfessionalProfile();

       // Fetch service requests
       this.fetchServiceRequests();
     },

     methods: {
       fetchProfessionalProfile() {
         const professionalId = localStorage.getItem('userId');

         axios.get(`http://127.0.0.1:5000/professionals/${professionalId}`)
           .then(response => {
             this.isVerified = response.data.is_verified;
           })
           .catch(error => {
             console.error('Error fetching professional profile:', error);
           });
       },

       fetchServiceRequests() {
         const professionalId = localStorage.getItem('userId');

         axios.get(`http://127.0.0.1:5000/professionals/${professionalId}/available-requests`)
           .then(response => {
             this.requests = response.data;
             this.filterRequests();
           })
           .catch(error => {
             console.error('Error fetching service requests:', error);
           })
           .finally(() => {
             this.loading = false;
           });
       },

       filterRequests() {
         let filtered = [...this.requests];

         // Apply search filter
         if (this.searchQuery.trim()) {
           const query = this.searchQuery.toLowerCase().trim();
           filtered = filtered.filter(request =>
             request.location.toLowerCase().includes(query) ||
             request.pin_code.includes(query)
           );
         }

         // Apply date filter
         if (this.dateFilter !== 'all') {
           const today = new Date();
           today.setHours(0, 0, 0, 0);

           const tomorrow = new Date(today);
           tomorrow.setDate(tomorrow.getDate() + 1);

           const nextWeek = new Date(today);
           nextWeek.setDate(nextWeek.getDate() + 7);

           filtered = filtered.filter(request => {
             const requestDate = new Date(request.preferred_date);
             requestDate.setHours(0, 0, 0, 0);

             if (this.dateFilter === 'today') {
               return requestDate.getTime() === today.getTime();
             } else if (this.dateFilter === 'tomorrow') {
               return requestDate.getTime() === tomorrow.getTime();
             } else if (this.dateFilter === 'week') {
               return requestDate >= today && requestDate <= nextWeek;
             }
             return true;
           });
         }

         // Apply time filter
         if (this.timeFilter !== 'all') {
           filtered = filtered.filter(request =>
             request.preferred_time === this.timeFilter
           );
         }

         this.filteredRequests = filtered;
       },

       acceptRequest(requestId) {
         if (!this.isVerified) {
           alert('Your account needs to be verified before you can accept requests.');
           return;
         }

         const professionalId = localStorage.getItem('userId');

         axios.post(`http://127.0.0.1:5000/service-requests/${requestId}/accept`, {
           professional_id: professionalId
         })
           .then(response => {
             // Remove the request from the list
             this.requests = this.requests.filter(req => req.id !== requestId);
             this.filterRequests();

             alert('Service request accepted successfully!');
           })
           .catch(error => {
             console.error('Error accepting request:', error);
             alert(error.response?.data?.error || 'Error accepting request. Please try again.');
           });
       },

       viewCustomerDetails(customerId) {
         this.selectedCustomer = null;
         this.customerModal.show();

         axios.get(`http://127.0.0.1:5000/customers/${customerId}`)
           .then(response => {
             this.selectedCustomer = response.data;
           })
           .catch(error => {
             console.error('Error fetching customer details:', error);
             alert('Error loading customer details. Please try again.');
             this.customerModal.hide();
           });
       },

       formatDate(dateString) {
         if (!dateString) return 'N/A';
         const date = new Date(dateString);
         return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
       },

       formatTimeSlot(timeSlot) {
         if (!timeSlot) return 'N/A';

         const timeMap = {
           'morning': 'Morning (8:00 AM - 12:00 PM)',
           'afternoon': 'Afternoon (12:00 PM - 4:00 PM)',
           'evening': 'Evening (4:00 PM - 8:00 PM)'
         };

         return timeMap[timeSlot] || timeSlot;
       }
     }
   };
