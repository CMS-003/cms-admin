import styled from 'styled-components';

export const TableCard = styled.div`
  flex: 1;
  max-width: 180px;
  min-height: 180px;
  margin-left: 10px;
  margin-bottom: 10px;
  padding: 8px;
  background-color: #fff;
  color: #0896db;
  border-radius: 3px;
`
export const TableTitle = styled.div`
  height: 32px;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

export const FormItem = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
`