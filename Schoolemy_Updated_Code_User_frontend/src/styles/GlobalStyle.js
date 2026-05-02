import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  body {
    /* This sets the background color for the entire page */
    background-color: ${({ theme }) => theme.colors.background.primary};
    
    /* Optional: Add some nice defaults */
    margin: 0;
    font-family: ${({ theme }) => theme.typography.fonts.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;

export default GlobalStyles;