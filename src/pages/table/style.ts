import styled from 'styled-components';

export const TableCard = styled.div`
  float: left;
  width: 200px;
  min-height: 250px;
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