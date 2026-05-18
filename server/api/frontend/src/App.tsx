import { BrowserRouter } from 'react-router';
import Theme from '@/components/template/Theme';
import Layout from '@/components/layouts';
import { AuthProvider } from '@/auth';
import Views from '@/views';
import { FirebaseProvider } from './auth/FirebaseProvider';
import React from 'react';
import { Provider } from 'react-redux';
import { rootStore } from './store/rootStore';

function App() {
   return (
      <Provider store={rootStore}>
         <FirebaseProvider>
            <Theme>
               <BrowserRouter>
                  <AuthProvider>
                     <Layout>
                        <Views />
                     </Layout>
                  </AuthProvider>
               </BrowserRouter>
            </Theme>
         </FirebaseProvider>
      </Provider>
   );
}

export default App;
