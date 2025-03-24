// professional-assignments.js
const ProfessionalAssignments = {
     template: `
       <div class="container mt-4" style="max-width: 1000px;">
         <h2 class="mb-4">My Assignments</h2>

         <!-- Tab navigation -->
         <ul class="nav nav-tabs mb-4">
           <li class="nav-item">
             <a class="nav-link" :class="{ active: activeTab === 'ongoing' }"
                @click.prevent="activeTab = 'ongoing'" href="#">
               Ongoing
             </a>
           </li>
           <li class="nav-item">
             <a class="nav-link" :class="{ active: activeTab === 'completed' }"
                @click.prevent="activeTab = 'completed'" href="#">
               Completed
             </a>
           </li>
         </ul>

         <!-- Loading indicator -->
         <div v-if="loading" class="text-center py-5">
           <div class="spinner-border text-primary" role="status">
             <span class="visually-hidden">Loading...</span>
           </div>
           <p class="mt-2">Loading your assignments...</p>
         </div>

         <!-- Ongoing Tab -->
         <div v-else-if="activeTab === 'ongoing'">
           <div v-if="ongoingAssignments.length === 0" class="alert alert-info">
             You don't have any ongoing assignments.
           </div>

           <div v-for="assignment in ongoingAssignments" :key="assignment.id" class="card mb-3 shadow-sm">
             <div class="card-body">
               <div class="row">
                 <div class="col-md-8">
                   <h5 class="card-title">{{ assignment.service_name }}</h5>
                   <p class="card-text">
                     <strong>Customer:</strong> {{ assignment.customer_name }}<br>
                     <strong>Accepted on:</strong> {{ formatDate(assignment.date_of_assignment) }}<br>
                     <strong>Scheduled for:</strong> {{ formatDate(assignment.preferred_date) }}<br>
                     <strong>Time:</strong> {{ formatTimeSlot(assignment.preferred_time) }}<br>
                     <strong>Location:</strong> {{ assignment.location }} - {{ assignment.pin_code }}
                   </p>
                   <p v-if="assignment.remarks" class="card-text">
                     <strong>Remarks:</strong> {{ assignment.remarks }}
                   </p>
                 </div>
                 <div class="col-md-4 d-flex flex-column justify-content-center align-items-end">
                   <button
                     @click="markCompleted(assignment.id)"
                     class="btn btn-success w-100 mb-2"
                   >
                     Mark as Completed
                   </button>
                   <button
                     @click="viewCustomerDetails(assignment.customer_id)"
                     class="btn btn-outline-primary w-100"
                   >
                     Customer Details
                   </button>
                 </div>
               </div>
             </div>
           </div>
         </div>

         <!-- Completed Tab -->
         <div v-else-if="activeTab === 'completed'">
           <div v-if="completedAssignments.length === 0" class="alert alert-info">
             You don't have any completed assignments.
           </div>

           <div v-for="assignment in completedAssignments" :key="assignment.id" class="card mb-3 shadow-sm">
             <div class="card-body">
               <div class="row">
                 <div class="col-md-8">
                   <h5 class="card-title">{{ assignment.service_name }}</h5>
                   <p class="card-text">
                     <strong>Customer:</strong> {{ assignment.customer_name }}<br>
                     <strong>Completed on:</strong> {{ formatDate(assignment.date_of_completion) }}<br>
                     <strong>Location:</strong> {{ assignment.location }} - {{ assignment.pin_code }}
                   </p>
                 </div>
                 <div class="col-md-4 d-flex flex-column justify-content-center align-items-end">
                   <!-- Customer's review if available -->
                   <div v-if="assignment.review" class="text-center w-100">
                     <div class="mb-2">
                       <span v-for="i in 5" :key="i" class="fs-4">
                         <span v-if="i <= assignment.review.rating">★</span>
                         <span v-else>☆</span>
                       </span>
                     </div>
                     <p class="fst-italic">
                       "{{ assignment.review.review_text || 'No review comment provided.' }}"
                     </p>
                   </div>
                   <div v-else class="text-center w-100 text-muted">
                     <p>No review yet</p>
                   </div>
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

         <!-- Completion confirmation modal -->
         <div class="modal fade" id="confirmCompletionModal" tabindex="-1" aria-hidden="true">
           <div class="modal-dialog">
             <div class="modal-content">
               <div class="modal-header">
                 <h5 class="modal-title">Confirm Service Completion</h5>
                 <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
               </div>
               <div class="modal-body">
                 <p>Are you sure you want to mark this service as completed?</p>
                 <p class="text-muted">This action cannot be undone. The customer will be notified and will be able to review the service.</p>
               </div>
               <div class="modal-footer">
                 <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                 <button type="button" class="btn btn-success" @click="confirmCompletion" :disabled="isSubmitting">
                   {{ isSubmitting ? 'Processing...' : 'Yes, Mark as Completed' }}
                 </button>
               </div>
             </div>
           </div>
         </div>
       </div>
     `,

     data() {
       return {
         activeTab: 'ongoing',
         assignments: [],
         loading: true,
         selectedCustomer: null,
         selectedAssignmentId: null,
         customerModal: null,
         confirmationModal: null,
         isSubmitting: false
       };
     },

     computed: {
       ongoingAssignments() {
         return this.assignments.filter(assign => assign.service_status === 'ASSIGNED');
       },

       completedAssignments() {
         return this.assignments.filter(assign => assign.service_status === 'CLOSED');
       }
     },

     mounted() {
       // Check authentication
       const userId = localStorage.getItem('userId');
       const userRole = localStorage.getItem('userRole');

       if (!userId || userRole !== 'PROFESSIONAL') {
         this.$router.push('/login');
         return;
       }

       // Initialize modals
       this.$nextTick(() => {
         this.customerModal = new bootstrap.Modal(document.getElementById('customerDetailsModal'));
         this.confirmationModal = new bootstrap.Modal(document.getElementById('confirmCompletionModal'));
       });

       // Fetch assignments
       this.fetchAssignments();
     },

     methods: {
       fetchAssignments() {
         const professionalId = localStorage.getItem('userId');

         axios.get(`http://127.0.0.1:5000/professionals/${professionalId}/assignments`)
           .then(response => {
             this.assignments = response.data;
           })
           .catch(error => {
             console.error('Error fetching assignments:', error);
           })
           .finally(() => {
             this.loading = false;
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

       markCompleted(assignmentId) {
         this.selectedAssignmentId = assignmentId;
         this.confirmationModal.show();
       },

       confirmCompletion() {
         if (!this.selectedAssignmentId) return;

         this.isSubmitting = true;

         axios.put(`http://127.0.0.1:5000/service-requests/${this.selectedAssignmentId}/complete`)
           .then(response => {
             this.confirmationModal.hide();
             this.fetchAssignments(); // Refresh the assignments
             alert('Service marked as completed successfully!');
           })
           .catch(error => {
             console.error('Error completing service:', error);
             alert(error.response?.data?.error || 'Error marking service as completed. Please try again.');
           })
           .finally(() => {
             this.isSubmitting = false;
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
