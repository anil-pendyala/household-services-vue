const ProfessionalManagement = {
     template: `
       <div class="container mt-4" style="max-width: 1000px;">
         <h2 class="text-center mb-4">Admin Dashboard - Manage Service Professionals</h2>

         <!-- Loading and Error Messages -->
         <div v-if="isLoading" class="text-center">
           <div class="spinner-border text-primary" role="status">
             <span class="visually-hidden">Loading...</span>
           </div>
         </div>
         <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>

         <!-- Professional Table -->
         <div class="table-responsive" v-if="!isLoading">
           <table class="table table-bordered table-hover">
             <thead class="table-primary">
               <tr>
                 <th>ID</th>
                 <th>Name</th>
                 <th>Email</th>
                 <th>Service</th>
                 <th>Experience</th>
                 <th>Profile Doc</th>
                 <th>Verification</th>
                 <th>Status</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               <tr v-for="professional in professionals" :key="professional.id">
                 <td>{{ professional.id }}</td>
                 <td>{{ professional.name }}</td>
                 <td>{{ professional.email }}</td>
                 <td>{{ professional.service_name }}</td>
                 <td>{{ professional.experience }} years</td>
                 <td>{{ professional.profile_doc_url || 'N/A' }}</td>
                 <td>
                   <span :class="professional.is_verified ? 'text-success' : 'text-warning'">
                     <i :class="['bi', professional.is_verified ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill']"></i>
                     {{ professional.is_verified ? 'Verified' : 'Pending' }}
                   </span>
                 </td>
                 <td>
                   <span :class="professional.is_active ? 'text-success' : 'text-danger'">
                     {{ professional.is_active ? 'Active' : 'Blocked' }}
                   </span>
                 </td>
                 <td>
                   <div class="d-flex gap-2">
                     <button
                       :class="['btn btn-sm', professional.is_active ? 'btn-danger' : 'btn-success']"
                       @click="confirmToggleStatus(professional)"
                     >
                       <i :class="['bi', professional.is_active ? 'bi-lock-fill' : 'bi-unlock-fill']"></i>
                       {{ professional.is_active ? 'Block' : 'Unblock' }}
                     </button>
                     <button
                       v-if="!professional.is_verified"
                       class="btn btn-sm btn-primary"
                       @click="confirmVerify(professional)"
                     >
                       <i class="bi bi-check-lg"></i> Verify
                     </button>
                     <button
                       class="btn btn-sm btn-info"
                       @click="viewProfile(professional)"
                     >
                       <i class="bi bi-eye"></i> Details
                     </button>
                   </div>
                 </td>
               </tr>
               <tr v-if="professionals.length === 0">
                 <td colspan="8" class="text-center">No service professionals found.</td>
               </tr>
             </tbody>
           </table>
         </div>

         <!-- Status Confirmation Modal -->
         <div class="modal fade" :class="{ 'show d-block': showStatusModal }" tabindex="-1" role="dialog">
           <div class="modal-dialog" role="document">
             <div class="modal-content">
               <div class="modal-header">
                 <h5 class="modal-title">Confirm Action</h5>
                 <button type="button" class="btn-close" @click="showStatusModal = false" aria-label="Close"></button>
               </div>
               <div class="modal-body">
                 <p v-if="selectedProfessional">
                   Are you sure you want to {{ selectedProfessional.is_active ? 'block' : 'unblock' }}
                   the service professional "{{ selectedProfessional.name }}"?
                 </p>
               </div>
               <div class="modal-footer">
                 <button type="button" class="btn btn-secondary" @click="showStatusModal = false">Cancel</button>
                 <button
                   type="button"
                   :class="['btn', selectedProfessional && selectedProfessional.is_active ? 'btn-danger' : 'btn-success']"
                   @click="toggleProfessionalStatus"
                 >
                   {{ selectedProfessional && selectedProfessional.is_active ? 'Block' : 'Unblock' }}
                 </button>
               </div>
             </div>
           </div>
         </div>
         <div class="modal-backdrop fade" :class="{ 'show': showStatusModal }" v-if="showStatusModal"></div>

         <!-- Verification Confirmation Modal -->
         <div class="modal fade" :class="{ 'show d-block': showVerifyModal }" tabindex="-1" role="dialog">
           <div class="modal-dialog" role="document">
             <div class="modal-content">
               <div class="modal-header">
                 <h5 class="modal-title">Confirm Verification</h5>
                 <button type="button" class="btn-close" @click="showVerifyModal = false" aria-label="Close"></button>
               </div>
               <div class="modal-body">
                 <p v-if="selectedProfessional">
                   Are you sure you want to verify the service professional "{{ selectedProfessional.name }}"?
                   This will allow them to receive service requests.
                 </p>
               </div>
               <div class="modal-footer">
                 <button type="button" class="btn btn-secondary" @click="showVerifyModal = false">Cancel</button>
                 <button type="button" class="btn btn-primary" @click="verifyProfessional">
                   Verify Professional
                 </button>
               </div>
             </div>
           </div>
         </div>
         <div class="modal-backdrop fade" :class="{ 'show': showVerifyModal }" v-if="showVerifyModal"></div>

         <!-- Professional Details Modal -->
         <div class="modal fade" :class="{ 'show d-block': showDetailsModal }" tabindex="-1" role="dialog">
           <div class="modal-dialog modal-lg" role="document">
             <div class="modal-content">
               <div class="modal-header">
                 <h5 class="modal-title">Professional Details</h5>
                 <button type="button" class="btn-close" @click="showDetailsModal = false" aria-label="Close"></button>
               </div>
               <div class="modal-body" v-if="selectedProfessional">
                 <div class="row">
                   <div class="col-md-6">
                     <div class="mb-3">
                       <strong>Name:</strong> {{ selectedProfessional.name }}
                     </div>
                     <div class="mb-3">
                       <strong>Email:</strong> {{ selectedProfessional.email }}
                     </div>
                     <div class="mb-3">
                       <strong>Service:</strong> {{ selectedProfessional.service_name }}
                     </div>
                     <div class="mb-3">
                       <strong>Experience:</strong> {{ selectedProfessional.experience }} years
                     </div>
                   </div>
                   <div class="col-md-6">
                     <div class="mb-3">
                       <strong>Status:</strong>
                       <span :class="selectedProfessional.is_active ? 'text-success' : 'text-danger'">
                         {{ selectedProfessional.is_active ? 'Active' : 'Blocked' }}
                       </span>
                     </div>
                     <div class="mb-3">
                       <strong>Verification:</strong>
                       <span :class="selectedProfessional.is_verified ? 'text-success' : 'text-warning'">
                         {{ selectedProfessional.is_verified ? 'Verified' : 'Pending Verification' }}
                       </span>
                     </div>
                     <div class="mb-3" v-if="selectedProfessional.profile_doc_url">
                       <strong>Profile Document:</strong>
                       <a :href="selectedProfessional.profile_doc_url" target="_blank">View Document</a>
                     </div>
                   </div>
                 </div>
                 <div class="row mt-3">
                   <div class="col-12">
                     <strong>Description:</strong>
                     <p>{{ selectedProfessional.description || 'No description provided.' }}</p>
                   </div>
                 </div>
               </div>
               <div class="modal-footer">
                 <button type="button" class="btn btn-secondary" @click="showDetailsModal = false">Close</button>
               </div>
             </div>
           </div>
         </div>
         <div class="modal-backdrop fade" :class="{ 'show': showDetailsModal }" v-if="showDetailsModal"></div>
       </div>
     `,
     data() {
       return {
         professionals: [],
         selectedProfessional: null,
         showStatusModal: false,
         showVerifyModal: false,
         showDetailsModal: false,
         isLoading: true,
         error: null
       };
     },
     created() {
       this.fetchProfessionals();
     },
     methods: {
       fetchProfessionals() {
         this.isLoading = true;
         this.error = null;

         axios.get('http://127.0.0.1:5000/professionals')
           .then(response => {
             this.professionals = response.data;
           })
           .catch(error => {
             this.error = error.response ? error.response.data.error : "Failed to load service professionals";
             console.error("Error fetching professionals:", error);
           })
           .finally(() => {
             this.isLoading = false;
           });
       },
       confirmToggleStatus(professional) {
         this.selectedProfessional = professional;
         this.showStatusModal = true;
       },
       confirmVerify(professional) {
         this.selectedProfessional = professional;
         this.showVerifyModal = true;
       },
       viewProfile(professional) {
         this.selectedProfessional = professional;
         this.showDetailsModal = true;
       },
       toggleProfessionalStatus() {
         if (!this.selectedProfessional) return;

         const userId = this.selectedProfessional.id;
         const action = this.selectedProfessional.is_active ? 'block' : 'unblock';

         axios.put(`http://127.0.0.1:5000/users/${userId}/${action}`)
           .then(response => {
             // Update the professional in the local array
             const index = this.professionals.findIndex(p => p.id === userId);
             if (index !== -1) {
               this.professionals[index].is_active = !this.professionals[index].is_active;
             }

             // Show success message
             alert(`Professional ${action}ed successfully!`);

             // Close modal
             this.showStatusModal = false;
             this.selectedProfessional = null;
           })
           .catch(error => {
             alert(error.response ? error.response.data.error : "An error occurred");
             console.error(`Error ${action}ing professional:`, error);
           });
       },
       verifyProfessional() {
         if (!this.selectedProfessional) return;

         const professionalId = this.selectedProfessional.id;

         axios.put(`http://127.0.0.1:5000/professionals/${professionalId}/verify`)
           .then(response => {
             // Update the professional in the local array
             const index = this.professionals.findIndex(p => p.id === professionalId);
             if (index !== -1) {
               this.professionals[index].is_verified = true;
             }

             // Show success message
             alert('Professional verified successfully!');

             // Close modal
             this.showVerifyModal = false;
             this.selectedProfessional = null;
           })
           .catch(error => {
             alert(error.response ? error.response.data.error : "An error occurred");
             console.error("Error verifying professional:", error);
           });
       }
     }
   };
