export const formatDateForInput = (date: Date): string => {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  export const formatDate = (date: Date): string => {
    if (!date) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    
    return date.toLocaleDateString('it-IT', options);
  };
  
  export const formatTime = (date: Date): string => {
    if (!date) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    
    return date.toLocaleTimeString('it-IT', options);
  };
  
  export const formatMonthYear = (date: Date, view: string): string => {
    if (!date) return '';
    
    let options: Intl.DateTimeFormatOptions = {};
    
    if (view === 'month') {
      options = { month: 'long', year: 'numeric' };
    } else if (view === 'week') {
      const startOfWeek = new Date(date);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adatta per iniziare da lunedì
      startOfWeek.setDate(diff);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startMonth = startOfWeek.toLocaleDateString('it-IT', { month: 'short' });
      const endMonth = endOfWeek.toLocaleDateString('it-IT', { month: 'short' });
      const startDay = startOfWeek.getDate();
      const endDay = endOfWeek.getDate();
      const year = endOfWeek.getFullYear();
      
      return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
    } else if (view === 'day') {
      options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    } else {
      options = { month: 'long', year: 'numeric' };
    }
    
    return date.toLocaleDateString('it-IT', options);
  };
  
  export const generateUniqueId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };
  