import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPERVISOR_PASSWORD_KEY = 'supervisor_password';

export const authService = {
  // Senha padrão do supervisor (pode ser alterada posteriormente)
  defaultPassword: '123456',

  // Verificar senha do supervisor
  async validateSupervisorPassword(password) {
    try {
      const storedPassword = await AsyncStorage.getItem(SUPERVISOR_PASSWORD_KEY);
      const validPassword = storedPassword || this.defaultPassword;
      
      return password === validPassword;
    } catch (error) {
      console.log('Erro ao validar senha:', error);
      return false;
    }
  },

  // Alterar senha do supervisor (requer senha atual)
  async changeSupervisorPassword(currentPassword, newPassword) {
    try {
      const isValid = await this.validateSupervisorPassword(currentPassword);
      if (!isValid) {
        return { success: false, message: 'Senha atual incorreta' };
      }

      await AsyncStorage.setItem(SUPERVISOR_PASSWORD_KEY, newPassword);
      return { success: true, message: 'Senha alterada com sucesso' };
    } catch (error) {
      console.log('Erro ao alterar senha:', error);
      return { success: false, message: 'Erro ao alterar senha' };
    }
  }
};