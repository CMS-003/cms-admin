import styled from 'styled-components';

export const TableCard = styled.div`
  float: left;
  width: 200px;
  min-height: 250px;
  margin: 10px;
  padding: 8px;
  background-color: #fff;
  color: #0896db;
  border-radius: 3px;
`
export const TableTitle = styled.div`
  height: 32px;
  font-size: 16px;
`
export const SubTitle = styled.h2`
  font-size: 14px;
  color: grey;
  margin-bottom: 0;
  & > span {
    color: #4e92f9;
    cursor: pointer;
  }
`